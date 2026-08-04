import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CustomerSource,
  CustomerStatus,
  CustomerType,
  CustomerValueLevel,
} from '../../../generated/prisma';
import { emptyToUndefined } from '../../../common/query-transform';

export class UpdateCustomerDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(160)
  company_name?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(60)
  contact_name?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(80)
  wechat?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(40)
  province?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(40)
  city?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customer_type?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerSource)
  source?: CustomerSource;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsEnum(CustomerValueLevel)
  value_level?: CustomerValueLevel;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;
}
