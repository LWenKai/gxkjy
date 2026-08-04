import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { parseBigIntId } from '../../common/id';
import { MemoryUploadFile } from '../../common/upload-files';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CustomerQuoteAttachmentsService } from './customer-quote-attachments.service';

@UseGuards(AdminAuthGuard, SuperAdminGuard)
@Controller('admin')
export class CustomerQuoteAttachmentsController {
  constructor(private readonly attachmentsService: CustomerQuoteAttachmentsService) {}

  @Get('customer-quotes/:quoteId/attachments')
  list(@Param('quoteId') quoteId: string) {
    return this.attachmentsService.list(parseBigIntId(quoteId, 'quote_id'));
  }

  @Post('customer-quotes/:quoteId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @Param('quoteId') quoteId: string,
    @UploadedFiles() files: MemoryUploadFile[],
    @Req() request: RequestWithAdmin,
  ) {
    return this.attachmentsService.upload(
      parseBigIntId(quoteId, 'quote_id'),
      files,
      request,
    );
  }

  @Get('customer-quote-attachments/:id/download')
  download(@Param('id') id: string, @Res() response: any) {
    return this.attachmentsService.download(parseBigIntId(id), response);
  }

  @Delete('customer-quote-attachments/:id')
  delete(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.attachmentsService.delete(parseBigIntId(id), request);
  }
}
