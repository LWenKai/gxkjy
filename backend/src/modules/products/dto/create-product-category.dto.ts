import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { emptyToUndefined } from '../../../common/query-transform';

export class CreateProductCategoryDto {
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(emptyToUndefined)
  sort?: number;
}
