ALTER TABLE `certificates`
  DROP FOREIGN KEY `certificates_detection_record_id_fkey`;

ALTER TABLE `certificates`
  MODIFY `detection_record_id` BIGINT NULL,
  ADD COLUMN `commitment_basis_type` VARCHAR(60) NOT NULL DEFAULT 'self_test_qualified',
  ADD COLUMN `commitment_statement` TEXT NULL,
  ADD COLUMN `issue_date` DATETIME(3) NULL,
  ADD COLUMN `print_copies` INT NOT NULL DEFAULT 1,
  ADD COLUMN `evidence_visibility` VARCHAR(30) NOT NULL DEFAULT 'private',
  ADD COLUMN `remark` VARCHAR(500) NULL;

ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_detection_record_id_fkey`
  FOREIGN KEY (`detection_record_id`) REFERENCES `detection_records`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `file_assets`
  ADD COLUMN `certificate_id` BIGINT NULL,
  ADD INDEX `file_assets_certificate_id_idx`(`certificate_id`);

ALTER TABLE `file_assets`
  ADD CONSTRAINT `file_assets_certificate_id_fkey`
  FOREIGN KEY (`certificate_id`) REFERENCES `certificates`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
