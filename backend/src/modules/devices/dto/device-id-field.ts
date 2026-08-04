import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';

export function normalizeIdValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(value);
}

export class OptionalIdField {
  @IsOptional()
  @Transform(({ value }) => normalizeIdValue(value))
  @Matches(/^\d+$/)
  company_id?: string;
}
