import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  company_id?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  product_name?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  product_category?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  @Transform(emptyToUndefined)
  status?: ProductStatus;
}
