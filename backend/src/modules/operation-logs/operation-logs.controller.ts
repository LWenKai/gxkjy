import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { OperationLogQueryDto } from './dto/operation-log-query.dto';
import { OperationLogsService } from './operation-logs.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/operation-logs')
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  list(@Query() query: OperationLogQueryDto) {
    return this.operationLogsService.list(query);
  }

  @Get('export')
  async export(@Query() query: OperationLogQueryDto, @Res() response: CsvResponse) {
    const csv = await this.operationLogsService.export(query);
    sendCsv(response, `操作日志导出_${todayForFilename()}.csv`, csv);
  }
}

