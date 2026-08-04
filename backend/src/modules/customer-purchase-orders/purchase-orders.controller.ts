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
import {
  CreatePurchaseOrderDto,
  PurchaseOrderQueryDto,
  RepurchaseReminderQueryDto,
  UpdatePurchaseOrderDto,
  UpdateRepurchaseStatusDto,
} from './dto/purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@UseGuards(AdminAuthGuard, SuperAdminGuard)
@Controller('admin')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get('customer-purchase-orders')
  list(@Query() query: PurchaseOrderQueryDto) {
    return this.purchaseOrdersService.list(query);
  }

  @Post('customer-purchase-orders')
  create(@Body() dto: CreatePurchaseOrderDto, @Req() request: RequestWithAdmin) {
    return this.purchaseOrdersService.create(dto, request);
  }

  @Get('customer-purchase-orders/:id')
  get(@Param('id') id: string) {
    return this.purchaseOrdersService.get(parseBigIntId(id));
  }

  @Put('customer-purchase-orders/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.purchaseOrdersService.update(parseBigIntId(id), dto, request);
  }

  @Delete('customer-purchase-orders/:id')
  delete(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.purchaseOrdersService.delete(parseBigIntId(id), request);
  }

  @Get('repurchase-reminders')
  reminders(@Query() query: RepurchaseReminderQueryDto) {
    return this.purchaseOrdersService.listRepurchaseReminders(query);
  }

  @Put('customer-purchase-items/:id/repurchase-status')
  updateRepurchaseStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRepurchaseStatusDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.purchaseOrdersService.updateRepurchaseStatus(
      parseBigIntId(id),
      dto.repurchase_status,
      request,
    );
  }
}
