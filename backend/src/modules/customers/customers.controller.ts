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
  UseGuards,
} from '@nestjs/common';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  CreateCustomerDeviceDto,
  CreateCustomerFollowRecordDto,
  CreateCustomerNeedDto,
  CreateCustomerPurchaseDto,
  CreateCustomerQuoteDto,
} from './dto/customer-record.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@UseGuards(AdminAuthGuard, SuperAdminGuard)
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Query() query: CustomerQueryDto) {
    return this.customersService.list(query);
  }

  @Get('repurchase-reminders')
  reminders() {
    return this.customersService.listRepurchaseReminders();
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @Req() request: RequestWithAdmin) {
    return this.customersService.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.customersService.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.update(parseBigIntId(id), dto, request);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.customersService.delete(parseBigIntId(id), request);
  }

  @Post(':id/needs')
  addNeed(
    @Param('id') id: string,
    @Body() dto: CreateCustomerNeedDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.addNeed(parseBigIntId(id), dto, request);
  }

  @Post(':id/devices')
  addDevice(
    @Param('id') id: string,
    @Body() dto: CreateCustomerDeviceDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.addDevice(parseBigIntId(id), dto, request);
  }

  @Post(':id/follow-records')
  addFollowRecord(
    @Param('id') id: string,
    @Body() dto: CreateCustomerFollowRecordDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.addFollowRecord(
      parseBigIntId(id),
      dto,
      request,
    );
  }

  @Post(':id/quotes')
  addQuote(
    @Param('id') id: string,
    @Body() dto: CreateCustomerQuoteDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.addQuote(parseBigIntId(id), dto, request);
  }

  @Post(':id/purchases')
  addPurchase(
    @Param('id') id: string,
    @Body() dto: CreateCustomerPurchaseDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.addPurchase(parseBigIntId(id), dto, request);
  }

  @Delete('needs/:recordId')
  deleteNeed(@Param('recordId') recordId: string, @Req() request: RequestWithAdmin) {
    return this.customersService.deleteNeed(parseBigIntId(recordId), request);
  }

  @Delete('devices/:recordId')
  deleteDevice(
    @Param('recordId') recordId: string,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.deleteDevice(parseBigIntId(recordId), request);
  }

  @Delete('follow-records/:recordId')
  deleteFollowRecord(
    @Param('recordId') recordId: string,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.deleteFollowRecord(
      parseBigIntId(recordId),
      request,
    );
  }

  @Delete('quotes/:recordId')
  deleteQuote(
    @Param('recordId') recordId: string,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.deleteQuote(parseBigIntId(recordId), request);
  }

  @Delete('purchases/:recordId')
  deletePurchase(
    @Param('recordId') recordId: string,
    @Req() request: RequestWithAdmin,
  ) {
    return this.customersService.deletePurchase(parseBigIntId(recordId), request);
  }
}
