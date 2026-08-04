import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CertificateType } from '../../../generated/prisma';

export enum CommitmentBasisType {
  quality_control = 'quality_control',
  self_test_qualified = 'self_test_qualified',
  entrusted_test_qualified = 'entrusted_test_qualified',
}

export class CreateCertificateDto {
  @IsEnum(CommitmentBasisType)
  commitment_basis_type: CommitmentBasisType =
    CommitmentBasisType.self_test_qualified;

  @IsOptional()
  @Matches(/^\d+$/)
  detection_record_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @Matches(/^\d+$/, { each: true })
  evidence_asset_ids?: string[];

  @IsOptional()
  @IsEnum(CertificateType)
  certificate_type?: CertificateType;

  @IsString()
  @IsNotEmpty()
  product_name!: string;

  @IsNumberString()
  quantity!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsString()
  @IsNotEmpty()
  issuer_name!: string;

  @IsString()
  @IsNotEmpty()
  contact_phone!: string;

  @IsOptional()
  @IsString()
  commitment_basis?: string;

  @IsOptional()
  @IsString()
  commitment_statement?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  print_copies?: number;
}
