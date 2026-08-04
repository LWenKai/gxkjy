import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { CompanyStatus } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';

export class CompanyQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  name?: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  @Transform(emptyToUndefined)
  status?: CompanyStatus;

  @IsOptional()
  @IsIn(['soon', 'expired'])
  @Transform(emptyToUndefined)
  expire?: 'soon' | 'expired';
}
