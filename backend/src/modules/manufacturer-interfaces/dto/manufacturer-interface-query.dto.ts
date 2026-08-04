import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ManufacturerInterfaceStatus,
  ManufacturerIntegrationType,
} from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';

export class ManufacturerInterfaceQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  manufacturer_name?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  manufacturer_code?: string;

  @IsOptional()
  @IsEnum(ManufacturerInterfaceStatus)
  @Transform(emptyToUndefined)
  status?: ManufacturerInterfaceStatus;

  @IsOptional()
  @IsEnum(ManufacturerIntegrationType)
  @Transform(emptyToUndefined)
  integration_type?: ManufacturerIntegrationType;
}
