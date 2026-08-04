import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ManufacturerUploadLogQueryDto } from './dto/manufacturer-upload-log-query.dto';
import { ManufacturerUploadLogsService } from './manufacturer-upload-logs.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/manufacturer-upload-logs')
export class ManufacturerUploadLogsController {
  constructor(private readonly logsService: ManufacturerUploadLogsService) {}

  @Get()
  list(@Query() query: ManufacturerUploadLogQueryDto) {
    return this.logsService.list(query);
  }

  @Get('export')
  async export(
    @Query() query: ManufacturerUploadLogQueryDto,
    @Res() response: CsvResponse,
  ) {
    const csv = await this.logsService.export(query);
    sendCsv(response, `厂家上传日志_${todayForFilename()}.csv`, csv);
  }
}
