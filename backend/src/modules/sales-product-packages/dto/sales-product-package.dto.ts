import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import { SalesProductPackageType } from '../../../generated/prisma';

export class SalesProductPackageQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(SalesProductPackageType)
  type?: SalesProductPackageType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  is_active?: boolean;
}

export class SalesProductPackageItemDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  sales_product_id?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(160)
  product_name?: string;

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
  @MaxLength(255)
  specification?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsNumberString()
  quantity!: string;

  @IsNumberString()
  unit_price!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  item_remark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}

export class CreateSalesProductPackageDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsEnum(SalesProductPackageType)
  type?: SalesProductPackageType;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesProductPackageItemDto)
  items!: SalesProductPackageItemDto[];
}

export class UpdateSalesProductPackageDto extends CreateSalesProductPackageDto {}

export class SetSalesProductPackageActiveDto {
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  is_active!: boolean;
}
