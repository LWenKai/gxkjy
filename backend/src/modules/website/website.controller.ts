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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { UpdateWebsiteMaterialDto } from './dto/update-website-material.dto';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';
import { WebsiteMaterialQueryDto } from './dto/website-material-query.dto';
import { WebsiteService } from './website.service';

const MAX_WEBSITE_FILE_SIZE = 20 * 1024 * 1024;

interface UploadedWebsiteFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@UseGuards(AdminAuthGuard)
@Controller('admin/website')
export class AdminWebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('materials')
  listMaterials(@Query() query: WebsiteMaterialQueryDto) {
    return this.websiteService.listAdmin(query);
  }

  @Post('materials/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_WEBSITE_FILE_SIZE },
    }),
  )
  uploadMaterial(
    @UploadedFile() file: UploadedWebsiteFile,
    @Body() dto: UpdateWebsiteMaterialDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.websiteService.uploadMaterial(file, dto, request);
  }

  @Put('materials/:id')
  updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteMaterialDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.websiteService.updateMaterial(parseBigIntId(id), dto, request);
  }

  @Delete('materials/:id')
  deleteMaterial(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.websiteService.deleteMaterial(parseBigIntId(id), request);
  }

  @Get('settings')
  getSettings() {
    return this.websiteService.getSettings();
  }

  @Put('settings')
  updateSettings(
    @Body() dto: UpdateWebsiteSettingsDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.websiteService.updateSettings(dto, request);
  }
}

@Controller('public/website')
export class PublicWebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('materials')
  listMaterials(@Query() query: WebsiteMaterialQueryDto) {
    return this.websiteService.listPublic(query);
  }

  @Get('settings')
  getSettings() {
    return this.websiteService.getPublicSettings();
  }
}
