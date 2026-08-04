import { Transform } from 'class-transformer';
import { IsNotEmpty, Matches } from 'class-validator';
import { normalizeIdValue } from './device-id-field';

export class BindDeviceDto {
  @Transform(({ value }) => normalizeIdValue(value))
  @IsNotEmpty()
  @Matches(/^\d+$/)
  company_id!: string;
}
