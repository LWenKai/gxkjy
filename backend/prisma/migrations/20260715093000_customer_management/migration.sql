ALTER TABLE `admin_users`
  ADD COLUMN `role` ENUM('super_admin', 'admin') NOT NULL DEFAULT 'super_admin';

CREATE TABLE `customers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_no` VARCHAR(40) NOT NULL,
  `company_name` VARCHAR(160) NOT NULL,
  `contact_name` VARCHAR(60) NULL,
  `phone` VARCHAR(30) NULL,
  `wechat` VARCHAR(80) NULL,
  `province` VARCHAR(40) NULL,
  `city` VARCHAR(40) NULL,
  `address` VARCHAR(255) NULL,
  `customer_type` ENUM('DELIVERY_COMPANY', 'FOOD_PROCESSING', 'COOPERATIVE', 'FARM_BASE', 'CANTEEN', 'MARKET', 'GOVERNMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `source` ENUM('DOUYIN', 'WECHAT', 'OLD_CUSTOMER', 'GOVERNMENT_RELATION', 'SUPPLIER_REFERRAL', 'ACTIVE_DEVELOP', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `status` ENUM('NEW', 'CONTACTED', 'NEED_CONFIRMED', 'QUOTED', 'NEGOTIATING', 'WON', 'FOLLOW_UP', 'LOST') NOT NULL DEFAULT 'NEW',
  `value_level` ENUM('PROJECT', 'REPEAT', 'NORMAL', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `remark` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `customers_customer_no_key` (`customer_no`),
  INDEX `customers_company_name_idx` (`company_name`),
  INDEX `customers_phone_idx` (`phone`),
  INDEX `customers_customer_type_idx` (`customer_type`),
  INDEX `customers_source_idx` (`source`),
  INDEX `customers_status_idx` (`status`),
  INDEX `customers_value_level_idx` (`value_level`),
  INDEX `customers_deleted_at_idx` (`deleted_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customer_needs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT NOT NULL,
  `need_type` ENUM('EQUIPMENT', 'LAB_BUILD', 'CONSUMABLE', 'CERTIFICATE', 'REPAIR') NOT NULL,
  `product_category` VARCHAR(80) NULL,
  `test_project` VARCHAR(200) NULL,
  `remark` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `customer_needs_customer_id_idx` (`customer_id`),
  INDEX `customer_needs_need_type_idx` (`need_type`),
  INDEX `customer_needs_deleted_at_idx` (`deleted_at`),
  CONSTRAINT `customer_needs_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customer_devices` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT NOT NULL,
  `manufacturer` VARCHAR(120) NULL,
  `model` VARCHAR(120) NULL,
  `device_count` INTEGER NOT NULL DEFAULT 1,
  `purchase_date` DATETIME(3) NULL,
  `image_url` VARCHAR(500) NULL,
  `remark` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `customer_devices_customer_id_idx` (`customer_id`),
  INDEX `customer_devices_deleted_at_idx` (`deleted_at`),
  CONSTRAINT `customer_devices_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customer_follow_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT NOT NULL,
  `follow_time` DATETIME(3) NOT NULL,
  `follow_type` ENUM('PHONE', 'WECHAT', 'VISIT', 'OTHER') NOT NULL,
  `content` TEXT NOT NULL,
  `next_follow_date` DATETIME(3) NULL,
  `created_by` BIGINT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `customer_follow_records_customer_id_idx` (`customer_id`),
  INDEX `customer_follow_records_follow_time_idx` (`follow_time`),
  INDEX `customer_follow_records_next_follow_date_idx` (`next_follow_date`),
  INDEX `customer_follow_records_deleted_at_idx` (`deleted_at`),
  CONSTRAINT `customer_follow_records_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customer_quotes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT NOT NULL,
  `product_name` VARCHAR(160) NOT NULL,
  `amount` DECIMAL(12, 2) NULL,
  `quote_date` DATETIME(3) NOT NULL,
  `status` ENUM('WAITING', 'FOLLOWING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'WAITING',
  `remark` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `customer_quotes_customer_id_idx` (`customer_id`),
  INDEX `customer_quotes_quote_date_idx` (`quote_date`),
  INDEX `customer_quotes_status_idx` (`status`),
  INDEX `customer_quotes_deleted_at_idx` (`deleted_at`),
  CONSTRAINT `customer_quotes_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `customer_purchases` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT NOT NULL,
  `product_name` VARCHAR(160) NOT NULL,
  `quantity` VARCHAR(80) NULL,
  `amount` DECIMAL(12, 2) NULL,
  `purchase_date` DATETIME(3) NOT NULL,
  `expected_cycle_days` INTEGER NULL,
  `next_repurchase_date` DATETIME(3) NULL,
  `remark` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `customer_purchases_customer_id_idx` (`customer_id`),
  INDEX `customer_purchases_purchase_date_idx` (`purchase_date`),
  INDEX `customer_purchases_next_repurchase_date_idx` (`next_repurchase_date`),
  INDEX `customer_purchases_deleted_at_idx` (`deleted_at`),
  CONSTRAINT `customer_purchases_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
