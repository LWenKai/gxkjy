import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { CertificatesService } from './certificates.service';
import {
  AdminCertificateQueryDto,
  ClientCertificateQueryDto,
  VoidCertificateDto,
} from './dto/certificate-query.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreatePrintLogDto } from './dto/create-print-log.dto';

const MAX_EVIDENCE_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/octet-stream',
  '',
]);

interface UploadedEvidenceFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@UseGuards(ClientAuthGuard)
@Controller('client/certificates')
export class ClientCertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  create(
    @Body() dto: CreateCertificateDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.certificatesService.create(dto, request);
  }

  @Get()
  list(
    @Query() query: ClientCertificateQueryDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.certificatesService.listClient(query, request);
  }

  @Get('latest')
  latest(@Req() request: RequestWithClientUser) {
    return this.certificatesService.getLatestClient(request);
  }

  @Post('evidence-files')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_EVIDENCE_FILE_SIZE },
      fileFilter: (
        _request: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_EVIDENCE_MIME_TYPES.has(file.mimetype || '')) {
          callback(new Error('仅支持 jpg、jpeg、png、webp、pdf 文件'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadEvidenceFile(
    @UploadedFile() file: UploadedEvidenceFile,
    @Body()
    dto: {
      file_name?: string;
      file_type?: string;
      is_public?: string | boolean;
    },
    @Req() request: RequestWithClientUser,
  ) {
    return this.certificatesService.uploadEvidenceFile(file, dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() request: RequestWithClientUser) {
    return this.certificatesService.getClient(parseBigIntId(id), request);
  }

  @Post(':id/void')
  void(@Param('id') id: string, @Req() request: RequestWithClientUser) {
    return this.certificatesService.voidClient(parseBigIntId(id), request);
  }

  @Get(':id/print-data')
  printData(@Param('id') id: string, @Req() request: RequestWithClientUser) {
    return this.certificatesService.getPrintData(parseBigIntId(id), request);
  }

  @Post(':id/print-logs')
  printLog(
    @Param('id') id: string,
    @Body() dto: CreatePrintLogDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.certificatesService.createPrintLog(
      parseBigIntId(id),
      dto,
      request,
    );
  }
}

@UseGuards(AdminAuthGuard)
@Controller('admin/certificates')
export class AdminCertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  list(@Query() query: AdminCertificateQueryDto) {
    return this.certificatesService.listAdmin(query);
  }

  @Get('export')
  async export(
    @Query() query: AdminCertificateQueryDto,
    @Res() response: CsvResponse,
  ) {
    const csv = await this.certificatesService.exportAdmin(query);
    sendCsv(response, `合格证导出_${todayForFilename()}.csv`, csv);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.certificatesService.getAdmin(parseBigIntId(id));
  }

  @Post(':id/void')
  void(
    @Param('id') id: string,
    @Body() dto: VoidCertificateDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.certificatesService.voidAdmin(parseBigIntId(id), request, dto.reason);
  }
}

