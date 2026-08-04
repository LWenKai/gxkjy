import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToBoolean, emptyToUndefined } from '../../../common/query-transform';

export class WebsiteMaterialQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(emptyToUndefined)
  category?: string;

  @IsOptional()
  @Transform(emptyToBoolean)
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @Transform(emptyToBoolean)
  @IsBoolean()
  is_recommended?: boolean;
}
