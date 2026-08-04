import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parseBigIntId } from '../../common/id';
import { MemoryUploadFile } from '../../common/upload-files';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import {
  CreateSalesProductDto,
  SalesProductQueryDto,
  UpdateSalesProductDto,
} from './dto/sales-product.dto';
import { SalesProductsService } from './sales-products.service';

@UseGuards(AdminAuthGuard, SuperAdminGuard)
@Controller('admin/sales-products')
export class SalesProductsController {
  constructor(private readonly salesProductsService: SalesProductsService) {}

  @Get()
  list(@Query() query: SalesProductQueryDto) {
    return this.salesProductsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateSalesProductDto, @Req() request: RequestWithAdmin) {
    return this.salesProductsService.create(dto, request);
  }

  @Post('ensure-defaults')
  ensureDefaults(@Req() request: RequestWithAdmin) {
    return this.salesProductsService.ensureDefaults(request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.salesProductsService.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesProductDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesProductsService.update(parseBigIntId(id), dto, request);
  }

  @Patch(':id/active')
  setActive(
    @Param('id') id: string,
    @Body() body: { is_active: boolean },
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesProductsService.setActive(
      parseBigIntId(id),
      body.is_active === true,
      request,
    );
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: MemoryUploadFile,
    @Req() request: RequestWithAdmin,
  ) {
    return this.salesProductsService.uploadImage(parseBigIntId(id), file, request);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.salesProductsService.delete(parseBigIntId(id), request);
  }
}
