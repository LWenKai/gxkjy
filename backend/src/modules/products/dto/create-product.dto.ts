import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ProductStatus } from '../../../generated/prisma';

export class CreateProductDto {
  @Matches(/^\d+$/, { message: '请选择企业' })
  company_id!: string;

  @IsString()
  @IsNotEmpty({ message: '请输入产品名称' })
  @MaxLength(120, { message: '产品名称不能超过 120 个字' })
  product_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: '产品分类不能超过 80 个字' })
  product_category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: '规格型号不能超过 120 个字' })
  spec_model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '产地不能超过 255 个字' })
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '默认单位不能超过 20 个字' })
  default_unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注不能超过 500 个字' })
  remark?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
