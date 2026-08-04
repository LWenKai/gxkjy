import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import {
  CreateSalesProductPackageDto,
  SalesProductPackageQueryDto,
  SetSalesProductPackageActiveDto,
  UpdateSalesProductPackageDto,
} from './dto/sales-product-package.dto';
import { SalesProductPackagesService } from './sales-product-packages.service';

@UseGuards(AdminAuthGuard, SuperAdminGuard)
@Controller('admin/sales-product-packages')
export class SalesProductPackagesController {
  constructor(private readonly salesProductPackagesService: SalesProductPackagesService) {}

  @Get()
  list(@Query() query: SalesProductPackageQueryDto) {
    return this.salesProductPackagesService.list(query);
  }

  @Post()
  create(@Body() dto: CreateSalesProductPackageDto, @Req() request: RequestWithAdmin) {
    return this.salesProductPackagesService.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.salesProductPackagesService.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesProductPackageDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesProductPackagesService.update(parseBigIntId(id), dto, request);
  }

  @Patch(':id/active')
  setActive(
    @Param('id') id: string,
    @Body() dto: SetSalesProductPackageActiveDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesProductPackagesService.setActive(parseBigIntId(id), dto.is_active, request);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.salesProductPackagesService.delete(parseBigIntId(id), request);
  }
}
