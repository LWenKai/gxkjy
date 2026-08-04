ALTER TABLE `file_assets`
  ADD COLUMN `storage_driver` VARCHAR(30) NOT NULL DEFAULT 'url',
  ADD COLUMN `deleted_at` DATETIME(3) NULL;
