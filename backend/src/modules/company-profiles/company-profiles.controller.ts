import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import {
  CreateCompanyProfileAssetDto,
  UpdateCompanyProfileAssetDto,
} from './dto/company-profile-asset.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CompanyProfilesService } from './company-profiles.service';

const MAX_PROFILE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PROFILE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

interface UploadedProfileFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class CompanyProfilesController {
  constructor(private readonly companyProfilesService: CompanyProfilesService) {}

  @Get('companies/:companyId/profile')
  getProfile(@Param('companyId') companyId: string) {
    return this.companyProfilesService.getProfile(parseBigIntId(companyId, 'company_id'));
  }

  @Put('companies/:companyId/profile')
  updateProfile(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyProfileDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyProfilesService.updateProfile(
      parseBigIntId(companyId, 'company_id'),
      dto,
      request,
    );
  }

  @Post('companies/:companyId/profile/assets')
  createAsset(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCompanyProfileAssetDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyProfilesService.createAsset(
      parseBigIntId(companyId, 'company_id'),
      dto,
      request,
    );
  }

  @Get('companies/:companyId/profile/files')
  getFiles(@Param('companyId') companyId: string) {
    return this.companyProfilesService.getProfileFiles(
      parseBigIntId(companyId, 'company_id'),
    );
  }

  @Post('companies/:companyId/profile/files')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_PROFILE_FILE_SIZE },
      fileFilter: (
        _request: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_PROFILE_MIME_TYPES.has(file.mimetype)) {
          callback(new Error('\u4ec5\u652f\u6301 jpg\u3001jpeg\u3001png\u3001webp\u3001pdf \u6587\u4ef6'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(
    @Param('companyId') companyId: string,
    @UploadedFile() file: UploadedProfileFile,
    @Body() dto: UpdateCompanyProfileAssetDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyProfilesService.uploadFile(
      parseBigIntId(companyId, 'company_id'),
      file,
      dto,
      request,
    );
  }

  @Put('company-profile-assets/:id')
  updateAsset(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyProfileAssetDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyProfilesService.updateAsset(parseBigIntId(id), dto, request);
  }

  @Post('company-profile-assets/:id/enable-public')
  enableAssetPublic(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyProfilesService.setAssetPublic(parseBigIntId(id), true, request);
  }

  @Post('company-profile-assets/:id/disable-public')
  disableAssetPublic(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyProfilesService.setAssetPublic(parseBigIntId(id), false, request);
  }

  @Put('company-profile-files/:id')
  updateFile(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyProfileAssetDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyProfilesService.updateAsset(parseBigIntId(id), dto, request);
  }

  @Delete('company-profile-files/:id')
  deleteFile(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyProfilesService.deleteAsset(parseBigIntId(id), request);
  }

  @Post('company-profile-files/:id/enable-public')
  enableFilePublic(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyProfilesService.setAssetPublic(parseBigIntId(id), true, request);
  }

  @Post('company-profile-files/:id/disable-public')
  disableFilePublic(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyProfilesService.setAssetPublic(parseBigIntId(id), false, request);
  }
}
