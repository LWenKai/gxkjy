import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientProductsController, ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController, ClientProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
