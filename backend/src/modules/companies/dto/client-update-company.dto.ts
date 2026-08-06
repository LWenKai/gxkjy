import {
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

const PHONE_PATTERN =
  /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|400-?\d{3}-?\d{4})$/;

function normalizePhone(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, '') : value;
}

export class ClientUpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizePhone(value))
  @Matches(PHONE_PATTERN, { message: '请输入正确的联系电话' })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  origin_address?: string;
}
