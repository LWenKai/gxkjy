ALTER TABLE `ai_interpretation_jobs`
  ADD COLUMN `error_message` VARCHAR(1000) NULL,
  ADD COLUMN `last_error` VARCHAR(1000) NULL,
  ADD COLUMN `retry_count` INT NOT NULL DEFAULT 0,
  ADD COLUMN `provider_name` VARCHAR(60) NULL,
  ADD COLUMN `model_name` VARCHAR(120) NULL,
  ADD COLUMN `prompt_version` VARCHAR(120) NULL,
  ADD COLUMN `standard_result_json` JSON NULL,
  ADD COLUMN `image_quality` VARCHAR(40) NULL,
  ADD COLUMN `image_quality_message` VARCHAR(500) NULL,
  ADD COLUMN `image_width` INT NULL,
  ADD COLUMN `image_height` INT NULL,
  ADD COLUMN `request_time` DATETIME(3) NULL,
  ADD COLUMN `response_time` DATETIME(3) NULL,
  ADD COLUMN `processing_at` DATETIME(3) NULL,
  ADD COLUMN `success_at` DATETIME(3) NULL,
  ADD COLUMN `failed_at` DATETIME(3) NULL,
  ADD COLUMN `confirming_at` DATETIME(3) NULL,
  ADD COLUMN `cancelled_at` DATETIME(3) NULL,
  ADD COLUMN `status_v2` ENUM('CREATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CONFIRMING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CREATED';

UPDATE `ai_interpretation_jobs`
SET
  `status_v2` = CASE
    WHEN `status` = 'confirmed' THEN 'CONFIRMED'
    WHEN `status` = 'failed' THEN 'FAILED'
    ELSE 'CONFIRMING'
  END,
  `success_at` = CASE
    WHEN `status` = 'interpreted' THEN COALESCE(`success_at`, `updated_at`)
    ELSE `success_at`
  END,
  `confirming_at` = CASE
    WHEN `status` = 'interpreted' THEN COALESCE(`confirming_at`, `updated_at`)
    ELSE `confirming_at`
  END,
  `failed_at` = CASE
    WHEN `status` = 'failed' THEN COALESCE(`failed_at`, `updated_at`)
    ELSE `failed_at`
  END,
  `confirmed_at` = CASE
    WHEN `status` = 'confirmed' THEN COALESCE(`confirmed_at`, `updated_at`)
    ELSE `confirmed_at`
  END,
  `error_message` = CASE
    WHEN `status` = 'failed' THEN COALESCE(`error_message`, `error_reason`)
    ELSE `error_message`
  END,
  `last_error` = CASE
    WHEN `status` = 'failed' THEN COALESCE(`last_error`, `error_reason`)
    ELSE `last_error`
  END;

ALTER TABLE `ai_interpretation_jobs` DROP INDEX `ai_interpretation_jobs_status_idx`;
ALTER TABLE `ai_interpretation_jobs` DROP COLUMN `status`;
ALTER TABLE `ai_interpretation_jobs` CHANGE COLUMN `status_v2` `status` ENUM('CREATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CONFIRMING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CREATED';
CREATE INDEX `ai_interpretation_jobs_status_idx` ON `ai_interpretation_jobs`(`status`);
