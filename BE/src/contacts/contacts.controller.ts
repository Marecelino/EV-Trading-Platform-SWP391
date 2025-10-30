import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ContactsPdfService } from './contacts-pdf.service';

@ApiTags('contacts')
  @ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly contactsPdfService: ContactsPdfService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo hợp đồng mới',
    description: 'Tạo hợp đồng cho giao dịch xe điện',
  })
  @ApiResponse({ status: 201, description: 'Hợp đồng được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách hợp đồng',
    description: 'Lấy danh sách hợp đồng với tùy chọn lọc và phân trang',
  })
  @ApiResponse({ status: 200, description: 'Danh sách hợp đồng' })
  findAll(@Query() filter: FilterContactsDto) {
    return this.contactsService.findAll(
      filter,
      filter.page || 1,
      filter.limit || 20,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin hợp đồng',
    description: 'Lấy chi tiết hợp đồng theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hợp đồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Thông tin hợp đồng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({
    summary: 'Lấy hợp đồng theo giao dịch',
    description: 'Lấy hợp đồng dựa trên ID giao dịch',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'ID của giao dịch',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Hợp đồng của giao dịch' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hợp đồng cho giao dịch này',
  })
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.contactsService.findByTransaction(transactionId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật hợp đồng',
    description: 'Cập nhật thông tin hợp đồng theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hợp đồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Hợp đồng được cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa hợp đồng',
    description: 'Xóa hợp đồng theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hợp đồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Hợp đồng được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Confirm typed consent signature for a contract' })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  async acceptTyped(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string },
    @Req() req: Request,
  ) {
    // Accept name/email from JSON body, form body or query string. If none provided,
    // default to an API marker or the authenticated user email if available.
    const signerName =
      body?.name ??
      (req as any)?.body?.name ??
      (req as any)?.query?.name ??
      (req as any)?.user?.email ??
      'accepted-via-api';
    const signerEmail =
      body?.email ??
      (req as any)?.body?.email ??
      (req as any)?.query?.email ??
      (req as any)?.user?.email ??
      undefined;

    const hash = crypto
      .createHash('sha256')
      .update(
        `${signerName}|${signerEmail || ''}|${req.ip || ''}|${Date.now()}`,
      )
      .digest('hex');

    await this.contactsService.confirmSignature(
      id,
      {
        signer_email: signerEmail,
        signer_id: signerName,
        signature_hash: hash,
        method: 'typed-consent',
        signed_at: new Date().toISOString(),
        mark_as_signed: true,
      },
      signerEmail || signerName,
    );

    // Try to render a signed PDF snapshot and store its URL on the contract.
    let signedUrl: string | null = null;
    try {
      signedUrl = await this.contactsPdfService.renderContractPdf(id);
      await this.contactsService.setSignedDocumentUrl(id, signedUrl);
    } catch (err) {
      // non-fatal: rendering failure shouldn't break the signature confirmation
      console.warn(
        'Failed to render contract PDF after signing:',
        err?.message || err,
      );
    }

    return { status: 'signed', signed_document_url: signedUrl };
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download rendered contract PDF (renders first if missing)',
  })
  async downloadContract(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const contract = await this.contactsService.findOne(id);

      let url =
        (contract as any).signed_document_url || (contract as any).document_url;

      if (!url) {
        // Render and persist the signed document URL
        url = await this.contactsPdfService.renderContractPdf(id);
        await this.contactsService.setSignedDocumentUrl(id, url);
      }

      // url is expected to be a path under the static /uploads mount (e.g. /uploads/contracts/..)
      const rel = url.replace(/^\/+/, '');
      // Prevent path traversal by resolving and ensuring it's under uploads
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      const filePath = path.resolve(process.cwd(), rel);
      if (!filePath.startsWith(uploadsDir)) {
        return res.status(400).json({ error: 'Invalid file path' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // If client prefers JSON, return the public URL (use Host header if available)
      const accept = (req.headers['accept'] || '').toString();
      const wantsJson =
        accept.includes('application/json') || req.query['json'] === '1';
      if (wantsJson) {
        const host =
          req.headers['host'] || `localhost:${process.env.PORT || 3000}`;
        const proto =
          (req.headers['x-forwarded-proto'] as string) ||
          (req as any).protocol ||
          'http';
        const fullUrl = `${proto}://${host}/${rel.replace(/^[\\/]+/, '')}`;
        return res.json({ url, download_url: fullUrl });
      }

      // Stream the file as attachment
      const stat = fs.statSync(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.basename(filePath)}"`,
      );
      // Allow caching for short time
      res.setHeader('Cache-Control', 'private, max-age=60');

      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('Error streaming file', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error reading file' });
        } else {
          res.end();
        }
      });
      stream.pipe(res);
    } catch (err) {
      console.error('downloadContract error', err?.message || err);
      return res.status(500).json({ error: 'Failed to download contract' });
    }
  }
}
