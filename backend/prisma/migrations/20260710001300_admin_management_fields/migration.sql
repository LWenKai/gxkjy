ALTER TABLE `products`
  ADD COLUMN `product_category` VARCHAR(80) NULL,
  ADD COLUMN `spec_model` VARCHAR(120) NULL,
  ADD COLUMN `default_unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
  ADD COLUMN `remark` VARCHAR(500) NULL;

ALTER TABLE `company_profiles`
  ADD COLUMN `qualification_description` VARCHAR(500) NULL;

ALTER TABLE `file_assets`
  ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;
