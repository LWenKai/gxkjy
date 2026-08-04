import { IsOptional, IsString, MinLength } from 'class-validator';

export class ResetCompanyUserPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
