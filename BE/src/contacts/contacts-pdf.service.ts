import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');
import { ContactsService } from './contacts.service';

@Injectable()
export class ContactsPdfService {
    constructor(private readonly contactsService: ContactsService) { }

    /**
     * Render a simple PDF snapshot for a contract and save it under uploads/contracts.
     * Returns a relative URL where the file can be accessed (served by main.ts).
     */
    async renderContractPdf(id: string): Promise<string> {
        const contract = await this.contactsService.findOne(id);
        if (!contract) throw new NotFoundException('Contract not found');

        const dir = path.resolve(process.cwd(), 'uploads', 'contracts');
        fs.mkdirSync(dir, { recursive: true });
        const fileName = `contract-${id}-${Date.now()}.pdf`;
        const filePath = path.join(dir, fileName);

        await new Promise<void>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            // Prefer a Unicode font that supports Vietnamese if available in ./fonts
            try {
                const fontCandidates = [
                    path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf'),
                    path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf'),
                    path.join(process.cwd(), 'fonts', 'DejaVuSansMono.ttf'),
                    // Common Times New Roman TTF filenames to check
                    path.join(process.cwd(), 'fonts', 'Times-New-Roman.ttf'),
                    path.join(process.cwd(), 'fonts', 'Times New Roman.ttf'),
                ];
                let chosen: string | null = null;
                for (const f of fontCandidates) {
                    if (fs.existsSync(f)) {
                        chosen = f;
                        break;
                    }
                }
                if (chosen) {
                    // Use the font file directly
                    doc.font(chosen);
                } else {
                    // Fall back to a core PDF font if no TTF is available
                    // Core fonts may not fully support Vietnamese, so recommend adding a Unicode TTF under ./fonts
                    console.warn('No Unicode TTF font found in ./BE/fonts. Vietnamese characters may render incorrectly. Place NotoSans-Regular.ttf or Times New Roman TTF into BE/fonts/ to fix.');
                    doc.font('Times-Roman');
                }
            } catch (e) {
                // ignore font loading errors and continue with default
            }
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            doc.fontSize(18).text('HỢP ĐỒNG MUA BÁN', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Số hợp đồng: ${(contract as any).contract_no || id}`);
            doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`);
            doc.moveDown();

            // Prefer populated transaction -> buyer_id.name and seller_id.name when available
            const transaction = (contract as any).transaction_id || {};
            const buyerName = transaction?.buyer_id?.name || (contract as any).buyer_name || '';
            const sellerName = transaction?.seller_id?.name || (contract as any).seller_name || '';
            const amount = transaction?.price || transaction?.amount || (contract as any).amount || '';

            doc.text(`Bên mua: ${buyerName}`);
            doc.text(`Bên bán: ${sellerName}`);
            doc.text(`Số tiền: ${amount}`);
            doc.moveDown();

            doc.text('ĐIỀU KHOẢN VÀ ĐIỀU KIỆN:');
            doc.moveDown(0.5);
            // Break long T&Cs into lines
            const terms = (contract as any).terms_and_conditions || 'Không có điều khoản.';
            const termsLines = terms.split(/\r?\n/);
            termsLines.forEach((l: string) => doc.fontSize(11).text(l));

            doc.moveDown();
            doc.text('Xác nhận ký:', { underline: false });
            doc.moveDown(1);

            // If the contract has been signed, show the buyer's digital signature only.
            const isSigned = !!(contract as any).signed_at || (contract as any).status === 'signed' || (contract as any).status === 'SIGNED';
            if (isSigned) {
                // Try to locate a signature audit event performed by the buyer
                const audit: any[] = (contract as any).audit_events || [];
                const sigEvents = audit.filter((e: any) => e && e.event === 'signature_confirmed');
                // buyer identifier candidates
                const buyerEmail = transaction?.buyer_id?.email || '';
                const buyerIdent = (buyerName || '').toString();
                let signerFound: any = null;
                for (const ev of sigEvents) {
                    if (!ev || !ev.by) continue;
                    const by = ev.by.toString();
                    if (by === buyerEmail || by === buyerIdent || by.includes(buyerIdent) || buyerIdent.includes(by)) {
                        signerFound = ev;
                        break;
                    }
                }

                const signedAt = (contract as any).signed_at ? new Date((contract as any).signed_at) : signerFound?.at ? new Date(signerFound.at) : null;

                // Render buyer signature information
                doc.fontSize(12).text(`Bên mua (ký điện tử): ${buyerName}`);
                if (signedAt) doc.fontSize(10).text(`Ngày ký: ${signedAt.toLocaleString('vi-VN')}`);
                // Optionally show signature hash if available
                if (sigEvents.length > 0) {
                    const hashes = sigEvents.map((e: any) => e.meta?.signature_hash).filter(Boolean);
                    if (hashes.length > 0) {
                        doc.moveDown(0.5);
                        doc.fontSize(9).text(`Mã chứng thực chữ ký: ${hashes[0]}`);
                    }
                }
            } else {
                // Not signed: show blank signature lines for both parties
                doc.text('Bên mua: ________________________', { continued: false });
                doc.moveDown(1);
                doc.text('Bên bán: ________________________');
            }

            doc.end();
            stream.on('finish', () => resolve());
            stream.on('error', (e) => reject(e));
        });

        // Return a path relative to the static /uploads mount
        return `/uploads/contracts/${fileName}`;
    }
}
