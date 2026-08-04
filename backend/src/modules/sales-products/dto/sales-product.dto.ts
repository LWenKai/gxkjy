import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import { SalesProductCategory } from '../../../generated/prisma';

export class SalesProductQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(SalesProductCategory)
  category?: SalesProductCategory;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  is_active?: boolean;
}

export class CreateSalesProductDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsEnum(SalesProductCategory)
  category!: SalesProductCategory;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(80)
  sales_model?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(255)
  specification?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsNumberString()
  default_sale_price?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsNumberString()
  reference_cost_price?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  default_cycle_days?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  repeat_reminder_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reference_cycle_days?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  default_reminder_days_before?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateSalesProductDto extends CreateSalesProductDto {}
