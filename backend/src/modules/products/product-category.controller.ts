import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { ProductCategoriesService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@UseGuards(ClientAuthGuard)
@Controller('client/product-categories')
export class ClientProductCategoriesController {
  constructor(private readonly service: ProductCategoriesService) {}

  @Get()
  list(@Req() request: RequestWithClientUser) {
    return this.service.list(request.clientUser!.companyId);
  }

  @Post()
  create(
    @Req() request: RequestWithClientUser,
    @Body() dto: CreateProductCategoryDto,
  ) {
    return this.service.create(request.clientUser!.companyId, dto);
  }

  @Put(':id')
  update(
    @Req() request: RequestWithClientUser,
    @Param('id') id: string,
    @Body() dto: CreateProductCategoryDto,
  ) {
    return this.service.update(request.clientUser!.companyId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: RequestWithClientUser, @Param('id') id: string) {
    return this.service.remove(request.clientUser!.companyId, id);
  }
}
