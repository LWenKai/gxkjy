-- 第 2 阶段：销售产品库、报价附件、采购单与按产品复购提醒。
-- 只新增结构并迁移旧采购记录，不删除 customer_purchases 旧表。

CREATE TABLE `sales_products` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `product_no` VARCHAR(40) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `category` ENUM('DETECTION_EQUIPMENT','ENZYME_REAGENT','COLLOIDAL_GOLD_CARD','LAB_CONSUMABLE','CERTIFICATE_PRINTER','PRINTING_CONSUMABLE','DATA_TERMINAL','SOFTWARE','SERVICE','OTHER') NOT NULL DEFAULT 'OTHER',
  `brand` VARCHAR(120) NULL,
  `model` VARCHAR(120) NULL,
  `specification` VARCHAR(255) NULL,
  `unit` VARCHAR(30) NOT NULL DEFAULT '件',
  `default_sale_price` DECIMAL(12,2) NULL,
  `reference_cost_price` DECIMAL(12,2) NULL,
  `default_cycle_days` INT NULL,
  `image_url` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `remark` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `sales_products_product_no_key` ON `sales_products`(`product_no`);
CREATE INDEX `sales_products_category_idx` ON `sales_products`(`category`);
CREATE INDEX `sales_products_is_active_idx` ON `sales_products`(`is_active`);
CREATE INDEX `sales_products_sort_order_idx` ON `sales_products`(`sort_order`);
CREATE INDEX `sales_products_deleted_at_idx` ON `sales_products`(`deleted_at`);

CREATE TABLE `customer_quote_attachments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `quote_id` BIGINT NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `mime_type` VARCHAR(120) NOT NULL,
  `file_extension` VARCHAR(20) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `uploaded_by` BIGINT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `customer_quote_attachments_quote_id_idx` ON `customer_quote_attachments`(`quote_id`);
CREATE INDEX `customer_quote_attachments_deleted_at_idx` ON `customer_quote_attachments`(`deleted_at`);
ALTER TABLE `customer_quote_attachments`
  ADD CONSTRAINT `customer_quote_attachments_quote_id_fkey`
  FOREIGN KEY (`quote_id`) REFERENCES `customer_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `customer_purchase_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(40) NOT NULL,
  `customer_id` BIGINT NOT NULL,
  `purchase_date` DATETIME(3) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('UNPAID','PAID','PARTIALLY_PAID','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `delivery_status` ENUM('PENDING','PURCHASING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `remark` TEXT NULL,
  `created_by` BIGINT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `customer_purchase_orders_order_no_key` ON `customer_purchase_orders`(`order_no`);
CREATE INDEX `customer_purchase_orders_customer_id_idx` ON `customer_purchase_orders`(`customer_id`);
CREATE INDEX `customer_purchase_orders_purchase_date_idx` ON `customer_purchase_orders`(`purchase_date`);
CREATE INDEX `customer_purchase_orders_payment_status_idx` ON `customer_purchase_orders`(`payment_status`);
CREATE INDEX `customer_purchase_orders_delivery_status_idx` ON `customer_purchase_orders`(`delivery_status`);
CREATE INDEX `customer_purchase_orders_deleted_at_idx` ON `customer_purchase_orders`(`deleted_at`);
ALTER TABLE `customer_purchase_orders`
  ADD CONSTRAINT `customer_purchase_orders_customer_id_fkey`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `customer_purchase_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `purchase_order_id` BIGINT NOT NULL,
  `sales_product_id` BIGINT NULL,
  `product_name_snapshot` VARCHAR(160) NOT NULL,
  `brand_snapshot` VARCHAR(120) NULL,
  `model_snapshot` VARCHAR(120) NULL,
  `specification_snapshot` VARCHAR(255) NULL,
  `unit_snapshot` VARCHAR(30) NULL,
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expected_cycle_days` INT NULL,
  `next_repurchase_date` DATETIME(3) NULL,
  `repurchase_status` ENUM('PENDING','CONTACTED','REPURCHASED','NO_NEED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `remark` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `customer_purchase_items_purchase_order_id_idx` ON `customer_purchase_items`(`purchase_order_id`);
CREATE INDEX `customer_purchase_items_sales_product_id_idx` ON `customer_purchase_items`(`sales_product_id`);
CREATE INDEX `customer_purchase_items_next_repurchase_date_idx` ON `customer_purchase_items`(`next_repurchase_date`);
CREATE INDEX `customer_purchase_items_repurchase_status_idx` ON `customer_purchase_items`(`repurchase_status`);
ALTER TABLE `customer_purchase_items`
  ADD CONSTRAINT `customer_purchase_items_purchase_order_id_fkey`
  FOREIGN KEY (`purchase_order_id`) REFERENCES `customer_purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `customer_purchase_items`
  ADD CONSTRAINT `customer_purchase_items_sales_product_id_fkey`
  FOREIGN KEY (`sales_product_id`) REFERENCES `sales_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `customer_purchase_orders` (
  `order_no`,
  `customer_id`,
  `purchase_date`,
  `total_amount`,
  `payment_status`,
  `delivery_status`,
  `remark`,
  `created_by`,
  `deleted_at`,
  `created_at`,
  `updated_at`
)
SELECT
  CONCAT('PO-LEGACY-', LPAD(`id`, 8, '0')),
  `customer_id`,
  `purchase_date`,
  COALESCE(`amount`, 0.00),
  'PAID',
  'DELIVERED',
  TRIM(CONCAT(COALESCE(`remark`, ''), IF(COALESCE(`remark`, '') = '', '', '\n'), '由旧采购记录迁移')),
  NULL,
  `deleted_at`,
  `created_at`,
  `updated_at`
FROM `customer_purchases`
WHERE NOT EXISTS (
  SELECT 1 FROM `customer_purchase_orders`
  WHERE `customer_purchase_orders`.`order_no` = CONCAT('PO-LEGACY-', LPAD(`customer_purchases`.`id`, 8, '0'))
);

INSERT INTO `customer_purchase_items` (
  `purchase_order_id`,
  `sales_product_id`,
  `product_name_snapshot`,
  `brand_snapshot`,
  `model_snapshot`,
  `specification_snapshot`,
  `unit_snapshot`,
  `quantity`,
  `unit_price`,
  `subtotal`,
  `expected_cycle_days`,
  `next_repurchase_date`,
  `repurchase_status`,
  `remark`,
  `created_at`,
  `updated_at`
)
SELECT
  `orders`.`id`,
  NULL,
  `purchases`.`product_name`,
  NULL,
  NULL,
  NULL,
  NULL,
  CASE
    WHEN `purchases`.`quantity` REGEXP '^[0-9]+(\\.[0-9]+)?$' AND CAST(`purchases`.`quantity` AS DECIMAL(12,2)) > 0
      THEN CAST(`purchases`.`quantity` AS DECIMAL(12,2))
    ELSE 1.00
  END,
  CASE
    WHEN `purchases`.`amount` IS NOT NULL
      THEN ROUND(`purchases`.`amount` / (
        CASE
          WHEN `purchases`.`quantity` REGEXP '^[0-9]+(\\.[0-9]+)?$' AND CAST(`purchases`.`quantity` AS DECIMAL(12,2)) > 0
            THEN CAST(`purchases`.`quantity` AS DECIMAL(12,2))
          ELSE 1.00
        END
      ), 2)
    ELSE 0.00
  END,
  COALESCE(`purchases`.`amount`, 0.00),
  `purchases`.`expected_cycle_days`,
  `purchases`.`next_repurchase_date`,
  'PENDING',
  TRIM(CONCAT(COALESCE(`purchases`.`remark`, ''), IF(COALESCE(`purchases`.`remark`, '') = '', '', '\n'), '由旧采购记录迁移')),
  `purchases`.`created_at`,
  `purchases`.`updated_at`
FROM `customer_purchases` AS `purchases`
INNER JOIN `customer_purchase_orders` AS `orders`
  ON `orders`.`order_no` = CONCAT('PO-LEGACY-', LPAD(`purchases`.`id`, 8, '0'));
