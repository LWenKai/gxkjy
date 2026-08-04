import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { PrinterConnectionType, PrinterRuntimeStatus } from '../../../generated/prisma';

const emptyToUndefined = ({ value }: { value: unknown }) => value === '' ? undefined : value;

export class PrinterQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  company_id?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  keyword?: string;

  @IsOptional()
  @IsEnum(PrinterConnectionType)
  @Transform(emptyToUndefined)
  connection_type?: PrinterConnectionType;

  @IsOptional()
  @IsEnum(PrinterRuntimeStatus)
  @Transform(emptyToUndefined)
  status?: PrinterRuntimeStatus;
}
