import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import { UploadLogResult } from '../../../generated/prisma';

export class ManufacturerUploadLogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  manufacturer_code?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  device_sn?: string;

  @IsOptional()
  @IsEnum(UploadLogResult)
  @Transform(emptyToUndefined)
  result?: UploadLogResult;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_from?: string;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_to?: string;
}
