CREATE TABLE `ai_interpretation_jobs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NOT NULL,
  `company_user_id` BIGINT NOT NULL,
  `detection_record_id` BIGINT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `test_item` VARCHAR(120) NOT NULL,
  `product_name` VARCHAR(120) NOT NULL,
  `sample_name` VARCHAR(120) NULL,
  `ai_result` ENUM('negative', 'positive', 'unknown', 'invalid') NULL,
  `confidence` DECIMAL(5, 4) NULL,
  `reason` VARCHAR(1000) NULL,
  `status` ENUM('interpreted', 'failed', 'confirmed') NOT NULL DEFAULT 'interpreted',
  `error_reason` VARCHAR(1000) NULL,
  `raw_response_json` JSON NULL,
  `confirmed_result` ENUM('negative', 'positive', 'unknown', 'invalid') NULL,
  `confirmed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ai_interpretation_jobs_detection_record_id_key`(`detection_record_id`),
  INDEX `ai_interpretation_jobs_company_id_idx`(`company_id`),
  INDEX `ai_interpretation_jobs_company_user_id_idx`(`company_user_id`),
  INDEX `ai_interpretation_jobs_status_idx`(`status`),
  INDEX `ai_interpretation_jobs_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ai_interpretation_jobs`
  ADD CONSTRAINT `ai_interpretation_jobs_company_id_fkey`
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ai_interpretation_jobs`
  ADD CONSTRAINT `ai_interpretation_jobs_company_user_id_fkey`
  FOREIGN KEY (`company_user_id`) REFERENCES `company_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ai_interpretation_jobs`
  ADD CONSTRAINT `ai_interpretation_jobs_detection_record_id_fkey`
  FOREIGN KEY (`detection_record_id`) REFERENCES `detection_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
