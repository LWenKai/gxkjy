import { IsDateString } from 'class-validator';

export class RenewCompanyDto {
  @IsDateString()
  service_expire_at!: string;
}
