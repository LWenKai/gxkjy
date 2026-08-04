import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientScreenController } from './client-screen.controller';
import { ClientScreenService } from './client-screen.service';

@Module({
  imports: [AuthModule],
  controllers: [ClientScreenController],
  providers: [ClientScreenService],
})
export class ClientScreenModule {}
