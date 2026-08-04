import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { DeviceStatus } from '../../../generated/prisma';
import { normalizeIdValue } from './device-id-field';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  manufacturer_code!: string;

  @IsString()
  @IsNotEmpty()
  device_sn!: string;

  @IsOptional()
  @IsString()
  device_name?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeIdValue(value))
  @Matches(/^\d+$/)
  company_id?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}
