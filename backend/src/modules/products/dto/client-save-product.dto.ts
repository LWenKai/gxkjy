import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClientSaveProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  product_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  default_unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
