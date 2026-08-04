import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  platform_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  service_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  support_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  public_footer_notice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  certificate_public_notice?: string;

  @IsOptional()
  @IsBoolean()
  show_support_info?: boolean;

  @IsOptional()
  @IsBoolean()
  show_company_public_profile?: boolean;
}
