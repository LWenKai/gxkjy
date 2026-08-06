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
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { ClientRequestUser, RequestWithClientUser } from '../auth/client-auth.types';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UpdateCompanyProfileAssetDto } from './dto/company-profile-asset.dto';
import { CompanyProfilesService } from './company-profiles.service';
import { parseBigIntId } from '../../common/id';

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

@UseGuards(ClientAuthGuard)
@Controller('client')
export class ClientCompanyProfileController {
  constructor(private readonly companyProfilesService: CompanyProfilesService) {}

  private getClientUser(request: RequestWithClientUser): ClientRequestUser {
    return request.clientUser!;
  }

  @Get('company-profile')
  getProfile(@Req() request: RequestWithClientUser) {
    return this.companyProfilesService.getProfile(this.getClientUser(request).companyId);
  }

  @Put('company-profile')
  updateProfile(
    @Req() request: RequestWithClientUser,
    @Body() dto: UpdateCompanyProfileDto,
  ) {
    return this.companyProfilesService.clientUpdateProfile(this.getClientUser(request), dto);
  }

  @Post('company-profile/files')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_PROFILE_FILE_SIZE },
      fileFilter: (
        _req: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_PROFILE_MIME_TYPES.has(file.mimetype)) {
          callback(new Error('仅支持 jpg、jpeg、png、webp、pdf 文件'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(
    @Req() request: RequestWithClientUser,
    @UploadedFile() file: UploadedProfileFile,
    @Body() dto: UpdateCompanyProfileAssetDto,
  ) {
    return this.companyProfilesService.clientUploadFile(
      this.getClientUser(request),
      file,
      dto,
    );
  }

  @Put('company-profile-files/:id')
  updateFile(
    @Req() request: RequestWithClientUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyProfileAssetDto,
  ) {
    return this.companyProfilesService.clientUpdateAsset(
      this.getClientUser(request),
      parseBigIntId(id),
      dto,
    );
  }

  @Post('company-profile-files/:id/enable-public')
  enableFilePublic(@Req() request: RequestWithClientUser, @Param('id') id: string) {
    return this.companyProfilesService.clientSetAssetPublic(
      this.getClientUser(request),
      parseBigIntId(id),
      true,
    );
  }

  @Post('company-profile-files/:id/disable-public')
  disableFilePublic(@Req() request: RequestWithClientUser, @Param('id') id: string) {
    return this.companyProfilesService.clientSetAssetPublic(
      this.getClientUser(request),
      parseBigIntId(id),
      false,
    );
  }

  @Delete('company-profile-files/:id')
  deleteFile(@Req() request: RequestWithClientUser, @Param('id') id: string) {
    return this.companyProfilesService.clientDeleteAsset(
      this.getClientUser(request),
      parseBigIntId(id),
    );
  }
}
