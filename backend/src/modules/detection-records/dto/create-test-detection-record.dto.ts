import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { DetectionApiResult } from './detection-record-result.dto';

export class TestDetectionRecordItemDto {
  @IsString()
  @IsNotEmpty()
  test_item!: string;

  @IsOptional()
  @IsString()
  test_method?: string;

  @IsString()
  @IsNotEmpty()
  test_value!: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  standard_limit?: string;

  @IsEnum(DetectionApiResult)
  result!: DetectionApiResult;
}

export class CreateTestDetectionRecordDto {
  @Matches(/^\d+$/)
  company_id!: string;

  @Matches(/^\d+$/)
  device_id!: string;

  @IsString()
  @IsNotEmpty()
  product_name!: string;

  @IsOptional()
  @IsString()
  sample_name?: string;

  @IsOptional()
  @IsString()
  sample_category?: string;

  @IsEnum(DetectionApiResult)
  overall_result!: DetectionApiResult;

  @IsOptional()
  @IsDateString()
  test_time?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TestDetectionRecordItemDto)
  items!: TestDetectionRecordItemDto[];
}
