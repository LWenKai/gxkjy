-- Add package source fields to sales quote items
ALTER TABLE `sales_quote_items`
  ADD COLUMN `source_package_id` BIGINT NULL,
  ADD COLUMN `source_package_name_snapshot` VARCHAR(160) NULL;

CREATE INDEX `sales_quote_items_source_package_id_idx` ON `sales_quote_items`(`source_package_id`);

-- Create sales product packages
CREATE TABLE `sales_product_packages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `package_no` VARCHAR(40) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `type` ENUM('BASIC', 'UPGRADE', 'PREMIUM', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `remark` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `sales_product_packages_package_no_key`(`package_no`),
  INDEX `sales_product_packages_type_idx`(`type`),
  INDEX `sales_product_packages_is_active_idx`(`is_active`),
  INDEX `sales_product_packages_sort_order_idx`(`sort_order`),
  INDEX `sales_product_packages_deleted_at_idx`(`deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create sales product package items
CREATE TABLE `sales_product_package_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `package_id` BIGINT NOT NULL,
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
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `sales_product_package_items_package_id_idx`(`package_id`),
  INDEX `sales_product_package_items_sales_product_id_idx`(`sales_product_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sales_product_package_items`
  ADD CONSTRAINT `sales_product_package_items_package_id_fkey`
  FOREIGN KEY (`package_id`) REFERENCES `sales_product_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `sales_product_package_items`
  ADD CONSTRAINT `sales_product_package_items_sales_product_id_fkey`
  FOREIGN KEY (`sales_product_id`) REFERENCES `sales_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sales_quote_items`
  ADD CONSTRAINT `sales_quote_items_source_package_id_fkey`
  FOREIGN KEY (`source_package_id`) REFERENCES `sales_product_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
