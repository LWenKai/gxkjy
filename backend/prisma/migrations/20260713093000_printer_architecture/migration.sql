-- Step 24: printer architecture preparation for Urovo K329 and future printers.
-- This migration only adds nullable fields / new tables. It does not delete existing print logs.

CREATE TABLE `printers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NULL,
  `printer_name` VARCHAR(120) NOT NULL,
  `printer_model` VARCHAR(80) NOT NULL,
  `manufacturer` VARCHAR(80) NULL,
  `connection_type` ENUM('mock', 'bluetooth', 'usb', 'wifi') NOT NULL DEFAULT 'bluetooth',
  `serial_no` VARCHAR(120) NULL,
  `mac_address` VARCHAR(120) NULL,
  `status` ENUM('inactive', 'available', 'connected', 'disabled') NOT NULL DEFAULT 'inactive',
  `last_connected_at` DATETIME(3) NULL,
  `remark` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `certificate_print_logs`
  ADD COLUMN `printer_id` BIGINT NULL,
  ADD COLUMN `printer_name` VARCHAR(120) NULL,
  ADD COLUMN `printer_model` VARCHAR(80) NULL,
  ADD COLUMN `connection_type` VARCHAR(30) NULL,
  ADD COLUMN `operator_name` VARCHAR(80) NULL;

CREATE INDEX `printers_company_id_idx` ON `printers`(`company_id`);
CREATE INDEX `printers_printer_model_idx` ON `printers`(`printer_model`);
CREATE INDEX `printers_connection_type_idx` ON `printers`(`connection_type`);
CREATE INDEX `printers_status_idx` ON `printers`(`status`);
CREATE INDEX `certificate_print_logs_printer_id_idx` ON `certificate_print_logs`(`printer_id`);

ALTER TABLE `printers`
  ADD CONSTRAINT `printers_company_id_fkey`
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `certificate_print_logs`
  ADD CONSTRAINT `certificate_print_logs_printer_id_fkey`
  FOREIGN KEY (`printer_id`) REFERENCES `printers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
