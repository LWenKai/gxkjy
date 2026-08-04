import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  intro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  main_products?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  display_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  display_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  qualification_description?: string;

  @IsOptional()
  @IsBoolean()
  is_public_enabled?: boolean;
}
