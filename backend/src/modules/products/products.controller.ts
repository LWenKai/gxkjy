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
  Res,
  UseGuards,
} from '@nestjs/common';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { CreateProductDto } from './dto/create-product.dto';
import { ClientSaveProductDto } from './dto/client-save-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.productsService.list(query);
  }

  @Get('export')
  async export(@Query() query: ProductQueryDto, @Res() response: CsvResponse) {
    const csv = await this.productsService.export(query);
    sendCsv(response, `产品库导出_${todayForFilename()}.csv`, csv);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() request: RequestWithAdmin) {
    return this.productsService.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.productsService.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.productsService.update(parseBigIntId(id), dto, request);
  }

  @Post(':id/enable')
  enable(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.productsService.enable(parseBigIntId(id), request);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.productsService.disable(parseBigIntId(id), request);
  }
}

@UseGuards(ClientAuthGuard)
@Controller('client/products')
export class ClientProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Req() request: RequestWithClientUser, @Query('keyword') keyword?: string) {
    return this.productsService.listClient(request, keyword);
  }

  @Post()
  save(@Body() dto: ClientSaveProductDto, @Req() request: RequestWithClientUser) {
    return this.productsService.saveClient(dto, request);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: ClientSaveProductDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.productsService.updateClient(parseBigIntId(id), dto, request);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() request: RequestWithClientUser) {
    return this.productsService.deleteClient(parseBigIntId(id), request);
  }
}

