-- Add formal sales quote workflow while preserving legacy simple quote and purchase data.

ALTER TABLE `sales_products`
  ADD COLUMN `repeat_reminder_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `reference_cycle_days` INTEGER NULL,
  ADD COLUMN `default_reminder_days_before` INTEGER NULL DEFAULT 7;

UPDATE `sales_products`
SET
  `reference_cycle_days` = `default_cycle_days`,
  `repeat_reminder_enabled` = CASE
    WHEN `category` IN ('ENZYME_REAGENT', 'COLLOIDAL_GOLD_CARD', 'LAB_CONSUMABLE', 'PRINTING_CONSUMABLE', 'SOFTWARE') THEN true
    ELSE false
  END
WHERE `deleted_at` IS NULL;

ALTER TABLE `customer_purchase_orders`
  MODIFY `delivery_status` ENUM('PENDING', 'PURCHASING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `sales_quote_id` BIGINT NULL,
  ADD COLUMN `quote_no_snapshot` VARCHAR(60) NULL,
  ADD COLUMN `deal_date` DATETIME(3) NULL,
  ADD COLUMN `expected_delivery_date` DATETIME(3) NULL,
  ADD COLUMN `actual_delivery_date` DATETIME(3) NULL,
  ADD COLUMN `express_company` VARCHAR(80) NULL,
  ADD COLUMN `tracking_no` VARCHAR(80) NULL,
  ADD COLUMN `invoice_issued` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `invoice_type` VARCHAR(80) NULL;

ALTER TABLE `customer_purchase_items`
  ADD COLUMN `repeat_reminder_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `actual_cycle_days` INTEGER NULL,
  ADD COLUMN `reminder_days_before` INTEGER NULL;

UPDATE `customer_purchase_items`
SET
  `repeat_reminder_enabled` = CASE WHEN `next_repurchase_date` IS NOT NULL THEN true ELSE false END,
  `actual_cycle_days` = `expected_cycle_days`,
  `reminder_days_before` = 7;

CREATE TABLE `sales_quotes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `quote_no` VARCHAR(60) NOT NULL,
  `quote_series_no` VARCHAR(40) NOT NULL,
  `version_no` INTEGER NOT NULL DEFAULT 1,
  `customer_id` BIGINT NOT NULL,
  `source_quote_id` BIGINT NULL,
  `source_order_item_id` BIGINT NULL,
  `quote_date` DATETIME(3) NOT NULL,
  `valid_until` DATETIME(3) NULL,
  `status` ENUM('DRAFT', 'GENERATED', 'SENT', 'CONFIRMING', 'ACCEPTED', 'LOST', 'EXPIRED', 'SUPERSEDED') NOT NULL DEFAULT 'DRAFT',
  `is_tax_included` BOOLEAN NOT NULL DEFAULT true,
  `invoice_note` TEXT NULL,
  `shipping_note` TEXT NULL,
  `delivery_note` TEXT NULL,
  `payment_note` TEXT NULL,
  `after_sales_note` TEXT NULL,
  `remark` TEXT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount_cn` VARCHAR(120) NULL,
  `pdf_path` VARCHAR(500) NULL,
  `excel_path` VARCHAR(500) NULL,
  `created_by` BIGINT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `sales_quotes_quote_no_key` (`quote_no`),
  INDEX `sales_quotes_customer_id_idx` (`customer_id`),
  INDEX `sales_quotes_quote_series_no_idx` (`quote_series_no`),
  INDEX `sales_quotes_quote_date_idx` (`quote_date`),
  INDEX `sales_quotes_status_idx` (`status`),
  INDEX `sales_quotes_deleted_at_idx` (`deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sales_quote_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sales_quote_id` BIGINT NOT NULL,
  `sales_product_id` BIGINT NULL,
  `product_name_snapshot` VARCHAR(160) NOT NULL,
  `brand_snapshot` VARCHAR(120) NULL,
  `model_snapshot` VARCHAR(120) NULL,
  `specification_snapshot` VARCHAR(255) NULL,
  `unit_snapshot` VARCHAR(30) NULL,
  `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `item_remark` TEXT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `sales_quote_items_sales_quote_id_idx` (`sales_quote_id`),
  INDEX `sales_quote_items_sales_product_id_idx` (`sales_product_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sales_quotes`
  ADD CONSTRAINT `sales_quotes_customer_id_fkey`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `sales_quote_items`
  ADD CONSTRAINT `sales_quote_items_sales_quote_id_fkey`
  FOREIGN KEY (`sales_quote_id`) REFERENCES `sales_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `sales_quote_items_sales_product_id_fkey`
  FOREIGN KEY (`sales_product_id`) REFERENCES `sales_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `customer_purchase_orders`
  ADD INDEX `customer_purchase_orders_sales_quote_id_idx` (`sales_quote_id`),
  ADD CONSTRAINT `customer_purchase_orders_sales_quote_id_fkey`
  FOREIGN KEY (`sales_quote_id`) REFERENCES `sales_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
