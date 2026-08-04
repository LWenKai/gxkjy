import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CertificateType, CompanyStatus } from '../../../generated/prisma';

const PHONE_PATTERN =
  /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|400-?\d{3}-?\d{4})$/;

function normalizePhone(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, '') : value;
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  contact_name!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizePhone(value))
  @Matches(PHONE_PATTERN, { message: '请输入正确的联系电话' })
  phone!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  origin_address?: string;

  @IsOptional()
  @IsString()
  customer_type?: string;

  @IsOptional()
  @IsString()
  service_note?: string;

  @IsOptional()
  @IsString()
  follow_up_note?: string;

  @IsOptional()
  @IsEnum(CertificateType)
  default_certificate_type?: CertificateType;

  @IsOptional()
  @IsDateString()
  service_start_at?: string;

  @IsOptional()
  @IsDateString()
  service_expire_at?: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}
