import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');
import { ContactsService } from './contacts.service';

@Injectable()
export class ContactsPdfService {
  constructor(private readonly contactsService: ContactsService) {}

  /**
   * Render a simple PDF snapshot for a contract and save it under uploads/contracts.
   * Returns a relative URL where the file can be accessed (served by main.ts).
   */
  // ...existing code...
  async renderContractPdf(id: string): Promise<string> {
    const contract = await this.contactsService.findOne(id);
    if (!contract) throw new NotFoundException('Contract not found');

    // Normalize/compose a full contract object that contains the fields you showed
    const tx =
      (contract as any).transaction || (contract as any).transaction_id || null;

    const normalizeRef = (ref: any) => {
      if (!ref && ref !== 0) return null;
      if (typeof ref === 'string') {
        const s = ref.trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined')
          return null;
        return { _id: s };
      }
      if (typeof ref === 'object') {
        // already populated doc or plain object
        return ref;
      }
      return { _id: String(ref) };
    };

    const fullContract: any = {
      _id: contract._id,
      contract_no: (contract as any).contract_no,
      status: (contract as any).status,
      document_url: (contract as any).document_url,
      terms_and_conditions: (contract as any).terms_and_conditions,
      signatures: (contract as any).signatures || [],
      notes: (contract as any).notes,
      audit_events: (contract as any).audit_events || [],
      createdAt: (contract as any).createdAt,
      updatedAt: (contract as any).updatedAt,
      signed_at: (contract as any).signed_at,
      signed_document_url: (contract as any).signed_document_url,
      transaction_id: tx
        ? {
            _id: tx._id || tx,
            listing_id: normalizeRef(tx.listing_id),
            buyer_id: normalizeRef(tx.buyer_id),
            seller_id: normalizeRef(tx.seller_id),
            price: tx.price,
            payment_method: tx.payment_method,
            payment_reference: tx.payment_reference,
            status: tx.status,
            notes: tx.notes,
            platform_fee: tx.platform_fee,
            seller_payout: tx.seller_payout,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt,
            commission_id: tx.commission_id,
            contract_id: tx.contract_id,
          }
        : null,
    };

    // If nested listing has brand populated, keep it
    if (
      fullContract.transaction_id?.listing_id &&
      (fullContract.transaction_id.listing_id as any).brand_id
    ) {
      fullContract.transaction_id.listing_id.brand_id = (
        fullContract.transaction_id.listing_id as any
      ).brand_id;
    }

    // Ensure buyer/seller name/phone/email are accessible even if not populated
    const buyer = fullContract.transaction_id?.buyer_id || {};
    const seller = fullContract.transaction_id?.seller_id || {};
    const listing = fullContract.transaction_id?.listing_id || {};

    // Create PDF with those normalized fields
    const dir = path.resolve(process.cwd(), 'uploads', 'contracts');
    fs.mkdirSync(dir, { recursive: true });
    const fileName = `contract-${id}-${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      try {
        const fontCandidates = [
          path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf'),
          path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf'),
          path.join(process.cwd(), 'fonts', 'DejaVuSansMono.ttf'),
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
        if (chosen) doc.font(chosen);
        else doc.font('Times-Roman');
      } catch (e) {
        doc.font('Times-Roman');
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc
        .fontSize(12)
        .text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      doc.moveDown(0.1);
      doc.fontSize(10).text('Độc lập - Tự do - Hạnh phúc', { align: 'center' });
      doc.moveDown(0.8);

      doc.fontSize(18).text('HỢP ĐỒNG MUA BÁN', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Số hợp đồng: ${fullContract.contract_no || id}`);
      doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`);
      doc.moveDown();

      // Buyer / Seller info
      const buyerName = buyer?.name || (contract as any).buyer_name || '';
      const buyerEmail = buyer?.email || (contract as any).buyer_email || '';
      const buyerPhone = buyer?.phone || (contract as any).buyer_phone || '';

      const sellerName = seller?.name || (contract as any).seller_name || '';
      const sellerEmail = seller?.email || (contract as any).seller_email || '';
      const sellerPhone = seller?.phone || (contract as any).seller_phone || '';

      doc.text(
        `Bên mua: ${buyerName}${buyerPhone ? ' (sđt: ' + buyerPhone + ')' : ''}${buyerEmail ? ' - ' + buyerEmail : ''}`,
      );
      doc.text(
        `Bên bán: ${sellerName}${sellerPhone ? ' (sđt: ' + sellerPhone + ')' : ''}${sellerEmail ? ' - ' + sellerEmail : ''}`,
      );

      // Amount / listing / brand
      const amount =
        fullContract.transaction_id?.price ?? (contract as any).amount ?? '';
      doc.text(`Số tiền: ${amount}`);

      const listingTitle =
        listing?.title || (contract as any).listing_title || '';
      const listingDesc =
        listing?.description || (contract as any).listing_description || '';
      const brandName =
        listing?.brand_id?.name || (contract as any).brand_name || '';

      if (brandName) doc.text(`Hãng xe: ${brandName}`);
      if (listingTitle) doc.text(`Tin bán: ${listingTitle}`);
      if (listingDesc) {
        const shortDesc =
          listingDesc.length > 300
            ? listingDesc.slice(0, 300) + '...'
            : listingDesc;
        doc.text(`Chi tiết tin: ${shortDesc}`);
      }

      doc.moveDown();
      doc.text('ĐIỀU KHOẢN VÀ ĐIỀU KIỆN:');
      doc.moveDown(0.5);
      const terms = fullContract.terms_and_conditions || 'Không có điều khoản.';
      terms.split(/\r?\n/).forEach((l: string) => doc.fontSize(11).text(l));

      doc.moveDown();
      doc.text('Xác nhận ký:', { underline: false });
      doc.moveDown(1);

      const isSigned =
        !!fullContract.signed_at ||
        fullContract.status === 'signed' ||
        fullContract.status === 'SIGNED';
      if (isSigned) {
        const audit: any[] = fullContract.audit_events || [];
        const sigEvents = audit.filter(
          (e: any) => e && e.event === 'signature_confirmed',
        );

        const buyerIdent = (buyerName || '').toString();
        const buyerEmailForMatch = buyerEmail || '';

        let signerFound: any = null;
        for (const ev of sigEvents) {
          if (!ev || !ev.by) continue;
          const by = ev.by.toString();
          if (
            by === buyerEmailForMatch ||
            by === buyerIdent ||
            by.includes(buyerIdent) ||
            buyerIdent.includes(by)
          ) {
            signerFound = ev;
            break;
          }
        }

        const signedAt = fullContract.signed_at
          ? new Date(fullContract.signed_at)
          : signerFound?.at
            ? new Date(signerFound.at)
            : null;

        doc.fontSize(12).text(`Bên mua (ký điện tử): ${buyerName || ''}`);
        if (signedAt)
          doc.fontSize(10).text(`Ngày ký: ${signedAt.toLocaleString('vi-VN')}`);

        if (sigEvents.length > 0) {
          const hashes = sigEvents
            .map((e: any) => e.meta?.signature_hash)
            .filter(Boolean);
          if (hashes.length > 0) {
            doc.moveDown(0.5);
            doc.fontSize(9).text(`Mã chứng thực chữ ký: ${hashes[0]}`);
          }
        }
      } else {
        doc.text('Bên mua: ________________________', { continued: false });
        doc.moveDown(1);
        doc.text('Bên bán: ________________________');
      }

      // Append a short JSON summary of the normalized object (optional, useful for debugging)
      doc.addPage();
      doc.fontSize(10).text('Tổng quan dữ liệu hợp đồng (debug):');
      doc.moveDown(0.5);
      const json = JSON.stringify(fullContract, null, 2);
      // split JSON into lines to avoid very long lines in PDF
      json.split(/\r?\n/).forEach((line: string) => doc.fontSize(8).text(line));

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (e) => reject(e));
    });

    return `/uploads/contracts/${fileName}`;
  }
  // ...existing code...
}
