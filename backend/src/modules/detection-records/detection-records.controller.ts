import {
  Body,
  Controller,
  Get,
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

