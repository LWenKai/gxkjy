import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PrintLogApiStatus {
  success = 'success',
  failed = 'failed',
}

export class CreatePrintLogDto {
  @IsEnum(PrintLogApiStatus)
  print_status!: PrintLogApiStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  copies?: number;

  @IsOptional()
  @IsString()
  adapter_type?: string;

  @IsOptional()
  @IsString()
  printer_id?: string;

  @IsOptional()
  @IsString()
  printer_name?: string;

  @IsOptional()
  @IsString()
  printer_model?: string;

  @IsOptional()
  @IsString()
  connection_type?: string;

  @IsOptional()
  @IsString()
  error_message?: string;
}
