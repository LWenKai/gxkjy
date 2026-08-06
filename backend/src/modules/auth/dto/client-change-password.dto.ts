import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ClientChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  old_password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  new_password!: string;
}
