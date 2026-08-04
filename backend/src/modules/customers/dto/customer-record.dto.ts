import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CustomerFollowType,
  CustomerNeedType,
  CustomerQuoteStatus,
} from '../../../generated/prisma';
import { emptyToUndefined } from '../../../common/query-transform';

export class CreateCustomerNeedDto {
  @IsEnum(CustomerNeedType)
  need_type!: CustomerNeedType;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(80)
  product_category?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(200)
  test_project?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;
}

export class CreateCustomerDeviceDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  manufacturer?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  device_count?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;
}

export class CreateCustomerFollowRecordDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  follow_time?: string;

  @IsEnum(CustomerFollowType)
  follow_type!: CustomerFollowType;

  @IsString()
  content!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  next_follow_date?: string;
}

export class CreateCustomerQuoteDto {
  @IsString()
  @MaxLength(160)
  product_name!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  quote_date?: string;

  @IsOptional()
  @IsEnum(CustomerQuoteStatus)
  status?: CustomerQuoteStatus;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;
}

export class CreateCustomerPurchaseDto {
  @IsString()
  @MaxLength(160)
  product_name!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(80)
  quantity?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expected_cycle_days?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  next_repurchase_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;
}
