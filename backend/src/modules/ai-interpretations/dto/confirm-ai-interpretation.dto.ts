import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmAiInterpretationDto {
  @IsIn(['negative', 'positive', 'unknown', 'invalid'], {
    message: '请选择正确的判读结果',
  })
  result!: 'negative' | 'positive' | 'unknown' | 'invalid';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  product_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sample_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  test_item?: string;
}
