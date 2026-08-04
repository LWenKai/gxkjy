import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { parseBigIntId } from '../../common/id';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { AiInterpretationsService } from './ai-interpretations.service';
import { ConfirmAiInterpretationDto } from './dto/confirm-ai-interpretation.dto';
import {
  CreateAiInterpretationBase64Dto,
  CreateAiInterpretationDto,
} from './dto/create-ai-interpretation.dto';

const MAX_AI_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_AI_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream',
  '',
]);

interface UploadedAiImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@UseGuards(ClientAuthGuard)
@Controller('client/ai-interpretations')
export class AiInterpretationsController {
  constructor(private readonly aiInterpretationsService: AiInterpretationsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_AI_IMAGE_SIZE },
      fileFilter: (
        _request: unknown,
        file: { mimetype?: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_AI_IMAGE_MIME_TYPES.has(file.mimetype || '')) {
          callback(new Error('仅支持 jpg、jpeg、png、webp 图片'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  create(
    @UploadedFile() file: UploadedAiImageFile,
    @Body() dto: CreateAiInterpretationDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.aiInterpretationsService.create(file, dto, request);
  }

  @Post('base64')
  createFromBase64(
    @Body() dto: CreateAiInterpretationBase64Dto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.aiInterpretationsService.createFromBase64(dto, request);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() request: RequestWithClientUser) {
    return this.aiInterpretationsService.get(parseBigIntId(id), request);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmAiInterpretationDto,
    @Req() request: RequestWithClientUser,
  ) {
    return this.aiInterpretationsService.confirm(
      parseBigIntId(id),
      dto,
      request,
    );
  }
}
