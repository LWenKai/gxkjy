import {
  Body,
  Controller,
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
import { CreateManufacturerInterfaceDto } from './dto/create-manufacturer-interface.dto';
import { ManufacturerInterfaceQueryDto } from './dto/manufacturer-interface-query.dto';
import { UpdateManufacturerInterfaceDto } from './dto/update-manufacturer-interface.dto';
import { ManufacturerInterfacesService } from './manufacturer-interfaces.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/manufacturer-interfaces')
export class ManufacturerInterfacesController {
  constructor(private readonly service: ManufacturerInterfacesService) {}

  @Get()
  list(@Query() query: ManufacturerInterfaceQueryDto) {
    return this.service.list(query);
  }

  @Post()
  create(
    @Body() dto: CreateManufacturerInterfaceDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.service.create(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(parseBigIntId(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateManufacturerInterfaceDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.service.update(parseBigIntId(id), dto, request);
  }

  @Post(':id/enable')
  enable(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.service.enable(parseBigIntId(id), request);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.service.disable(parseBigIntId(id), request);
  }

  @Post(':id/regenerate-secret')
  regenerateSecret(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.service.regenerateSecret(parseBigIntId(id), request);
  }
}
