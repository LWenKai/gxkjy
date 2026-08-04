import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { DeviceStatus } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import { normalizeIdValue } from './device-id-field';

export class DeviceQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  manufacturer_code?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeIdValue(value))
  @Matches(/^\d+$/)
  company_id?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  @Transform(emptyToUndefined)
  status?: DeviceStatus;

  @IsOptional()
  @IsIn(['bound', 'unbound'])
  @Transform(emptyToUndefined)
  bind_status?: 'bound' | 'unbound';
}
