import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAiInterpretationDto {
  @IsString()
  @IsNotEmpty({ message: '请选择检测项目' })
  @MaxLength(120)
  test_item!: string;

  @IsString()
  @IsNotEmpty({ message: '请输入产品名称' })
  @MaxLength(120)
  product_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sample_name?: string;
}

export class CreateAiInterpretationBase64Dto extends CreateAiInterpretationDto {
  @IsString()
  @IsNotEmpty({ message: '请上传检测卡图片' })
  image_base64!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  image_mime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  original_name?: string;
}
