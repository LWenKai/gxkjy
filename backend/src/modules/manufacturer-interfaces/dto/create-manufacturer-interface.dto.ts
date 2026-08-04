import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  ManufacturerInterfaceStatus,
  ManufacturerIntegrationType,
} from '../../../generated/prisma';

export class CreateManufacturerInterfaceDto {
  @IsString()
  @IsNotEmpty()
  manufacturer_name!: string;

  @IsOptional()
  @IsString()
  manufacturer_code?: string;

  @IsOptional()
  @IsString()
  access_secret?: string;

  @IsOptional()
  @IsEnum(ManufacturerIntegrationType)
  integration_type?: ManufacturerIntegrationType;

  @IsOptional()
  @IsEnum(ManufacturerInterfaceStatus)
  status?: ManufacturerInterfaceStatus;

  @IsOptional()
  @IsString()
  sign_rule?: string;

  @IsOptional()
  @IsString()
  allowed_ips?: string;
}
