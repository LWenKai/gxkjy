import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsOptional, Matches } from 'class-validator';
import { DetectionRecordStatus } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import { DetectionApiResult } from './detection-record-result.dto';

export class AdminDetectionRecordQueryDto extends PaginationDto {
  @IsOptional()
  @Matches(/^\d+$/)
  @Transform(emptyToUndefined)
  company_id?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  @Transform(emptyToUndefined)
  device_id?: string;

  @IsOptional()
  @IsEnum(DetectionApiResult)
  @Transform(emptyToUndefined)
  overall_result?: DetectionApiResult;

  @IsOptional()
  @IsEnum(DetectionRecordStatus)
  @Transform(emptyToUndefined)
  status?: DetectionRecordStatus;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_from?: string;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_to?: string;

  @IsOptional()
  @IsIn(['abnormal'])
  @Transform(emptyToUndefined)
  attention?: 'abnormal';
}
