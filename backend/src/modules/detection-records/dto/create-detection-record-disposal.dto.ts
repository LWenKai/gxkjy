import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDetectionRecordDisposalDto {
  @IsString()
  @MaxLength(40)
  disposition!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateDetectionRecordDisposalDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  disposition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
