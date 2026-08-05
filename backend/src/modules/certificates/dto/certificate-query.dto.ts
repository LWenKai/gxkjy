import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { CertificateStatus } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';

export class ClientCertificateQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CertificateStatus)
  @Transform(emptyToUndefined)
  status?: CertificateStatus;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  product_name?: string;
}

export class AdminCertificateQueryDto extends PaginationDto {
  @IsOptional()
  @Matches(/^\d+$/)
  @Transform(emptyToUndefined)
  company_id?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  product_name?: string;

  @IsOptional()
  @IsEnum(CertificateStatus)
  @Transform(emptyToUndefined)
  status?: CertificateStatus;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_from?: string;

  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndefined)
  date_to?: string;
}

export class VoidCertificateDto {
  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  reason?: string;
}
