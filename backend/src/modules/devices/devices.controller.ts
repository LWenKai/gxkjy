import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { DevicesService } from './devices.service';
import { BindDeviceDto } from './dto/bind-device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@UseGuards(AdminAuthGuard)
@Controller('admin/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  list(@Query() query: DeviceQueryDto) {
    return this.devicesService.list(query);
  }

  @Get('export')
  async export(@Query() query: DeviceQueryDto, @Res() response: CsvResponse) {
    const csv = await this.devicesService.export(query);
    sendCsv(response, `设备管理导出_${todayForFilename()}.csv`, csv);
  }

  @Post()
  create(@Body() dto: CreateDeviceDto, @Req() request: RequestWithAdmin) {
    return this.devicesService.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.devicesService.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.devicesService.update(parseBigIntId(id), dto, request);
  }

  @Post(':id/bind')
  bind(
    @Param('id') id: string,
    @Body() dto: BindDeviceDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.devicesService.bind(parseBigIntId(id), dto, request);
  }

  @Post(':id/unbind')
  unbind(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.devicesService.unbind(parseBigIntId(id), request);
  }

  @Post(':id/enable')
  enable(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.devicesService.enable(parseBigIntId(id), request);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.devicesService.disable(parseBigIntId(id), request);
  }
}

