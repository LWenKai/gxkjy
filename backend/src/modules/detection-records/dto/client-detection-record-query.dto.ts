import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import { DetectionApiResult } from './detection-record-result.dto';

export class ClientDetectionRecordQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DetectionApiResult)
  @Transform(emptyToUndefined)
  overall_result?: DetectionApiResult;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  sample_name?: string;
}
