import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ManufacturerInterfacesController } from './manufacturer-interfaces.controller';
import { ManufacturerInterfacesService } from './manufacturer-interfaces.service';

@Module({
  imports: [AuthModule],
  controllers: [ManufacturerInterfacesController],
  providers: [ManufacturerInterfacesService],
})
export class ManufacturerInterfacesModule {}
