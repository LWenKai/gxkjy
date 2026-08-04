import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';

export class OperationLogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  operator?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  target_type?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  action?: string;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_from?: string;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_to?: string;
}
