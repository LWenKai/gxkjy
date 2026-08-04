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
  SalesQuoteStatus,
} from '../../../generated/prisma';

export class SalesQuoteQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsEnum(SalesQuoteStatus)
  status?: SalesQuoteStatus;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  keyword?: string;
}

export class SalesQuoteItemDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  sales_product_id?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  source_package_id?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(160)
  source_package_name?: string;

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
  @Transform(emptyToUndefined)
  @IsString()
  item_remark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}

export class CreateSalesQuoteDto {
  @IsString()
  customer_id!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  quote_date?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  valid_until?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  is_tax_included?: boolean;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  invoice_note?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  shipping_note?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  delivery_note?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  payment_note?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  after_sales_note?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesQuoteItemDto)
  items!: SalesQuoteItemDto[];
}

export class UpdateSalesQuoteDto extends CreateSalesQuoteDto {}

export class UpdateSalesQuoteStatusDto {
  @IsEnum(SalesQuoteStatus)
  status!: SalesQuoteStatus;
}

export class ConvertQuoteToOrderItemDto {
  @IsString()
  quote_item_id!: string;

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
}

export class ConvertQuoteToOrderDto {
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConvertQuoteToOrderItemDto)
  items?: ConvertQuoteToOrderItemDto[];
}

export class RepurchaseQuoteDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsNumberString()
  quantity?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsNumberString()
  unit_price?: string;
}
