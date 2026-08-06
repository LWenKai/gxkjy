import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientProductsController, ProductsController } from './products.controller';
import { ClientProductCategoriesController } from './product-category.controller';
import { ProductCategoriesService } from './product-category.service';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController, ClientProductsController, ClientProductCategoriesController],
  providers: [ProductsService, ProductCategoriesService],
})
export class ProductsModule {}
