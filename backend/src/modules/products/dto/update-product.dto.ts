import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ProductStatus } from '../../../generated/prisma';

export class UpdateProductDto {
  @IsOptional()
  @Matches(/^\d+$/)
  company_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  product_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  product_category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  spec_model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  default_unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
