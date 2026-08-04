ALTER TABLE `companies`
  ADD COLUMN `customer_type` VARCHAR(80) NULL,
  ADD COLUMN `service_note` TEXT NULL,
  ADD COLUMN `follow_up_note` VARCHAR(500) NULL;
