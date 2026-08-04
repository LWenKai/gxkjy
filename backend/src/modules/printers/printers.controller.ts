import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { PrinterQueryDto } from './dto/printer-query.dto';
import { PrintersService } from './printers.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/printers')
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Get()
  list(@Query() query: PrinterQueryDto) {
    return this.printersService.list(query);
  }

  @Get('export')
  async export(@Query() query: PrinterQueryDto, @Res() response: CsvResponse) {
    const csv = await this.printersService.export(query);
    sendCsv(response, `打印设备导出_${todayForFilename()}.csv`, csv);
  }

  @Get('test-payload')
  testPayload() {
    return this.printersService.testPayload();
  }

  @Post()
  create(@Body() dto: CreatePrinterDto, @Req() request: RequestWithAdmin) {
    return this.printersService.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.printersService.get(parseBigIntId(id));
  }
}
