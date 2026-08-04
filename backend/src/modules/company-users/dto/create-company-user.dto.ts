import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccountStatus } from '../../../generated/prisma';

export class CreateCompanyUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  real_name?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
