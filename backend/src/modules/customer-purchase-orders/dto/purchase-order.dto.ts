import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';
import { emptyToUndefined } from '../../../common/query-transform';
import {
  PurchaseDeliveryStatus,
  PurchasePaymentStatus,
  RepurchaseStatus,
} from '../../../generated/prisma';

export class PurchaseOrderQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsEnum(PurchasePaymentStatus)
  payment_status?: PurchasePaymentStatus;

  @IsOptional()
  @IsEnum(PurchaseDeliveryStatus)
  delivery_status?: PurchaseDeliveryStatus;
}

export class PurchaseOrderItemDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  sales_product_id?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(160)
  product_name?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(255)
  specification?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsNumberString()
  quantity!: string;

  @IsNumberString()
  unit_price!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expected_cycle_days?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  repeat_reminder_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actual_cycle_days?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reminder_days_before?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  next_repurchase_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(RepurchaseStatus)
  repurchase_status?: RepurchaseStatus;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  customer_id!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  deal_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  expected_delivery_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  actual_delivery_date?: string;

  @IsOptional()
  @IsEnum(PurchasePaymentStatus)
  payment_status?: PurchasePaymentStatus;

  @IsOptional()
  @IsEnum(PurchaseDeliveryStatus)
  delivery_status?: PurchaseDeliveryStatus;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  express_company?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  tracking_no?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  invoice_issued?: boolean;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  invoice_type?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {}

export class RepurchaseReminderQueryDto {
  @IsOptional()
  @IsEnum(RepurchaseStatus)
  status?: RepurchaseStatus;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  range?: 'overdue' | '7d' | '30d' | 'all';
}

export class UpdateRepurchaseStatusDto {
  @IsEnum(RepurchaseStatus)
  repurchase_status!: RepurchaseStatus;
}
