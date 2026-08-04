import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  CustomerSource,
  CustomerStatus,
  CustomerType,
  CustomerValueLevel,
} from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';

export class CustomerQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(CustomerSource)
  source?: CustomerSource;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(CustomerType)
  customer_type?: CustomerType;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(CustomerValueLevel)
  value_level?: CustomerValueLevel;
}
