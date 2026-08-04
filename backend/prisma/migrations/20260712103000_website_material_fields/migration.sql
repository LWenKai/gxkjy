ALTER TABLE `file_assets`
  ADD COLUMN `title` VARCHAR(255) NULL,
  ADD COLUMN `category` VARCHAR(80) NULL,
  ADD COLUMN `description` VARCHAR(500) NULL,
  ADD COLUMN `is_recommended` BOOLEAN NOT NULL DEFAULT false,
  ADD INDEX `file_assets_category_idx`(`category`),
  ADD INDEX `file_assets_is_recommended_idx`(`is_recommended`);
