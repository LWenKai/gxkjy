import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { DetectionRecordsService } from './detection-records.service';
import { AdminDetectionRecordQueryDto } from './dto/admin-detection-record-query.dto';
import { ClientDetectionRecordQueryDto } from './dto/client-detection-record-query.dto';
import { CreateTestDetectionRecordDto } from './dto/create-test-detection-record.dto';
import {
  CreateDetectionRecordDisposalDto,
  UpdateDetectionRecordDisposalDto,
} from './dto/create-detection-record-disposal.dto';

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminTestDetectionRecordsController {
  constructor(
    private readonly detectionRecordsService: DetectionRecordsService,
  ) {}

  @Post('test-detection-records')
  createTestRecord(
    @Body() dto: CreateTestDetectionRecordDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.detectionRecordsService.createTestRecord(dto, request);
  }
}

@UseGuards(ClientAuthGuard)
@Controller('client')
export class ClientDetectionRecordsController {
  constructor(
    private readonly detectionRecordsService: DetectionRecordsService,
  ) {}

  @Get('detection-records')
  list(
    @Query() query: ClientDetectionRecordQueryDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.detectionRecordsService.listClientRecords(query, request);
  }

  @Get('detection-records/export')
  async export(
    @Query() query: ClientDetectionRecordQueryDto,
    @Query('fields') fields: string | undefined,
    @Req() request: RequestWithClientUser,
    @Res() response: CsvResponse,
  ) {
    const csv = await this.detectionRecordsService.exportClientRecords(
      query,
      request,
      fields,
    );
    if (csv === null) {
      response.status(HttpStatus.NO_CONTENT).send('');
      return;
    }
    sendCsv(response, `检测记录导出_${todayForFilename()}.csv`, csv);
  }

  @Get('detection-records/export-excel')
  async exportExcel(
    @Query() query: ClientDetectionRecordQueryDto,
    @Req() request: RequestWithClientUser,
    @Res() response: any,
  ) {
    const buffer = await this.detectionRecordsService.exportClientRecordsExcel(
      query,
      request,
    );
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    const fileNameUtf8 = `检测记录报表_${todayForFilename()}.xlsx`;
    const fileNameAscii = `detection-records_${todayForFilename()}.xlsx`;
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileNameAscii}"; filename*=UTF-8''${encodeURIComponent(fileNameUtf8)}`,
    );
    response.send(buffer);
  }

  @Get('detection-records/:id')
  get(@Param('id') id: string, @Req() request: RequestWithClientUser) {
    return this.detectionRecordsService.getClientRecord(
      parseBigIntId(id),
      request,
    );
  }

  @Get('certifiable-records')
  certifiable(
    @Query() query: ClientDetectionRecordQueryDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.detectionRecordsService.listCertifiableRecords(query, request);
  }

  @Get('big-screen')
  bigScreen(@Req() request: RequestWithClientUser) {
    return this.detectionRecordsService.getClientBigScreen(request);
  }

  // -- 不合格处理闭环 --

  @Get('detection-records/:id/disposals')
  listDisposals(
    @Param('id') id: string,
    @Req() request: RequestWithClientUser,
  ) {
    return this.detectionRecordsService.listClientRecordDisposals(
      parseBigIntId(id),
      request,
    );
  }

  @Post('detection-records/:id/disposals')
  createDisposal(
    @Param('id') id: string,
    @Body() dto: CreateDetectionRecordDisposalDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.detectionRecordsService.createClientRecordDisposal(
      parseBigIntId(id),
      dto,
      request,
    );
  }

  @Post('detection-records/:id/disposals/:disposalId')
  updateDisposal(
    @Param('id') id: string,
    @Param('disposalId') disposalId: string,
    @Body() dto: UpdateDetectionRecordDisposalDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.detectionRecordsService.updateClientRecordDisposal(
      parseBigIntId(disposalId),
      dto,
      request,
    );
  }

  @Post('detection-records/:id/disposals/:disposalId/delete')
  deleteDisposal(
    @Param('id') id: string,
    @Param('disposalId') disposalId: string,
    @Req() request: RequestWithClientUser,
  ) {
    return this.detectionRecordsService.deleteClientRecordDisposal(
      parseBigIntId(disposalId),
      request,
    );
  }
}

@UseGuards(AdminAuthGuard)
@Controller('admin/detection-records')
export class AdminDetectionRecordsController {
  constructor(
    private readonly detectionRecordsService: DetectionRecordsService,
  ) {}

  @Get()
  list(@Query() query: AdminDetectionRecordQueryDto) {
    return this.detectionRecordsService.listAdminRecords(query);
  }

  @Get('export')
  async export(
    @Query() query: AdminDetectionRecordQueryDto,
    @Res() response: CsvResponse,
  ) {
    const csv = await this.detectionRecordsService.exportAdminRecords(query);
    sendCsv(response, `检测记录导出_${todayForFilename()}.csv`, csv);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.detectionRecordsService.getAdminRecord(parseBigIntId(id));
  }

  @Post(':id/mark-abnormal')
  markAbnormal(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @Req() request: RequestWithAdmin,
  ) {
    return this.detectionRecordsService.markAbnormal(
      parseBigIntId(id),
      request,
      body?.reason,
    );
  }

  @Post(':id/hide')
  hide(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @Req() request: RequestWithAdmin,
  ) {
    return this.detectionRecordsService.hide(
      parseBigIntId(id),
      request,
      body?.reason,
    );
  }

  @Post(':id/void')
  void(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @Req() request: RequestWithAdmin,
  ) {
    return this.detectionRecordsService.void(
      parseBigIntId(id),
      request,
      body?.reason,
    );
  }

  @Post(':id/restore')
  restore(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @Req() request: RequestWithAdmin,
  ) {
    return this.detectionRecordsService.restore(
      parseBigIntId(id),
      request,
      body?.reason,
    );
  }

  @Post(':id/cancel-abnormal')
  cancelAbnormal(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @Req() request: RequestWithAdmin,
  ) {
    return this.detectionRecordsService.cancelAbnormal(
      parseBigIntId(id),
      request,
      body?.reason,
    );
  }
}

