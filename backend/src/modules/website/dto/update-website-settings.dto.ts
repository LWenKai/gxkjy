import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWebsiteSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  home_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  home_subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  primary_button_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  secondary_button_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contact_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  wechat_tip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  company_intro?: string;

  @IsOptional()
  @IsBoolean()
  show_materials?: boolean;

  @IsOptional()
  @IsBoolean()
  show_cloud_module?: boolean;
}
