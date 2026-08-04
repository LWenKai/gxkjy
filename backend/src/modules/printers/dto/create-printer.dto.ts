import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrinterConnectionType, PrinterRuntimeStatus } from '../../../generated/prisma';

export class CreatePrinterDto {
  @IsOptional()
  @IsString()
  company_id?: string;

  @IsString()
  @MaxLength(120)
  printer_name!: string;

  @IsString()
  @MaxLength(80)
  printer_model!: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsEnum(PrinterConnectionType)
  connection_type!: PrinterConnectionType;

  @IsOptional()
  @IsString()
  serial_no?: string;

  @IsOptional()
  @IsString()
  mac_address?: string;

  @IsOptional()
  @IsEnum(PrinterRuntimeStatus)
  status?: PrinterRuntimeStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}
