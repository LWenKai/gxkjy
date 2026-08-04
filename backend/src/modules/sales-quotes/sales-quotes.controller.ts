import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import {
  ConvertQuoteToOrderDto,
  CreateSalesQuoteDto,
  RepurchaseQuoteDto,
  SalesQuoteQueryDto,
  UpdateSalesQuoteDto,
  UpdateSalesQuoteStatusDto,
} from './dto/sales-quote.dto';
import { SalesQuotesService } from './sales-quotes.service';

@UseGuards(AdminAuthGuard, SuperAdminGuard)
@Controller('admin/sales-quotes')
export class SalesQuotesController {
  constructor(private readonly salesQuotesService: SalesQuotesService) {}

  @Get()
  list(@Query() query: SalesQuoteQueryDto) {
    return this.salesQuotesService.list(query);
  }

  @Post()
  create(@Body() dto: CreateSalesQuoteDto, @Req() request: RequestWithAdmin) {
    return this.salesQuotesService.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.salesQuotesService.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesQuoteDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesQuotesService.update(parseBigIntId(id), dto, request);
  }

  @Post(':id/generate-files')
  generateFiles(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.salesQuotesService.generateFiles(parseBigIntId(id), request);
  }

  @Post(':id/create-version')
  createVersion(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.salesQuotesService.createVersion(parseBigIntId(id), request);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSalesQuoteStatusDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesQuotesService.updateStatus(parseBigIntId(id), dto.status, request);
  }

  @Post(':id/convert-to-order')
  convertToOrder(
    @Param('id') id: string,
    @Body() dto: ConvertQuoteToOrderDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesQuotesService.convertToOrder(parseBigIntId(id), dto, request);
  }

  @Post('repurchase-items/:id/create-quote')
  createRepurchaseQuote(
    @Param('id') id: string,
    @Body() dto: RepurchaseQuoteDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesQuotesService.createRepurchaseQuote(parseBigIntId(id), dto, request);
  }

  @Get(':id/download/:type')
  async download(
    @Param('id') id: string,
    @Param('type') type: 'pdf' | 'excel',
    @Res() response: any,
  ) {
    const file = await this.salesQuotesService.getDownloadFile(
      parseBigIntId(id),
      type === 'excel' ? 'excel' : 'pdf',
    );
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    file.stream.pipe(response);
  }
}
