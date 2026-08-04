-- CreateTable
CREATE TABLE `admin_users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(60) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `real_name` VARCHAR(60) NULL,
    `status` ENUM('normal', 'disabled') NOT NULL DEFAULT 'normal',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `contact_name` VARCHAR(60) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `address` VARCHAR(255) NULL,
    `origin_address` VARCHAR(255) NULL,
    `status` ENUM('normal', 'disabled') NOT NULL DEFAULT 'normal',
    `service_start_at` DATETIME(3) NULL,
    `service_expire_at` DATETIME(3) NOT NULL,
    `default_certificate_type` ENUM('agri_commitment_certificate', 'enterprise_quick_test_label') NOT NULL DEFAULT 'agri_commitment_certificate',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `companies_status_idx`(`status`),
    INDEX `companies_service_expire_at_idx`(`service_expire_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `username` VARCHAR(60) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `real_name` VARCHAR(60) NULL,
    `status` ENUM('normal', 'disabled') NOT NULL DEFAULT 'normal',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_users_username_key`(`username`),
    INDEX `company_users_company_id_idx`(`company_id`),
    INDEX `company_users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manufacturer_interfaces` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `manufacturer_name` VARCHAR(120) NOT NULL,
    `manufacturer_code` VARCHAR(60) NOT NULL,
    `access_secret` VARCHAR(255) NOT NULL,
    `integration_type` ENUM('http_api', 'mqtt', 'tcp_socket') NOT NULL DEFAULT 'http_api',
    `status` ENUM('unconfigured', 'connected', 'abnormal', 'disabled') NOT NULL DEFAULT 'unconfigured',
    `sign_rule` VARCHAR(255) NULL,
    `allowed_ips` VARCHAR(500) NULL,
    `last_sync_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `manufacturer_interfaces_manufacturer_code_key`(`manufacturer_code`),
    INDEX `manufacturer_interfaces_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `manufacturer_code` VARCHAR(60) NOT NULL,
    `device_sn` VARCHAR(120) NOT NULL,
    `device_name` VARCHAR(120) NULL,
    `model` VARCHAR(120) NULL,
    `company_id` BIGINT NULL,
    `status` ENUM('enabled', 'disabled', 'offline') NOT NULL DEFAULT 'enabled',
    `last_upload_at` DATETIME(3) NULL,
    `remark` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `devices_company_id_idx`(`company_id`),
    INDEX `devices_status_idx`(`status`),
    UNIQUE INDEX `devices_manufacturer_code_device_sn_key`(`manufacturer_code`, `device_sn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detection_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `record_no` VARCHAR(60) NOT NULL,
    `company_id` BIGINT NOT NULL,
    `device_id` BIGINT NOT NULL,
    `manufacturer_code` VARCHAR(60) NOT NULL,
    `device_sn` VARCHAR(120) NOT NULL,
    `manufacturer_record_id` VARCHAR(120) NOT NULL,
    `sample_name` VARCHAR(120) NULL,
    `product_name` VARCHAR(120) NOT NULL,
    `overall_result` ENUM('pass', 'fail') NOT NULL,
    `test_time` DATETIME(3) NOT NULL,
    `upload_time` DATETIME(3) NOT NULL,
    `status` ENUM('normal', 'marked_abnormal', 'hidden', 'voided') NOT NULL DEFAULT 'normal',
    `raw_payload_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `detection_records_record_no_key`(`record_no`),
    INDEX `detection_records_company_id_idx`(`company_id`),
    INDEX `detection_records_device_id_idx`(`device_id`),
    INDEX `detection_records_overall_result_idx`(`overall_result`),
    INDEX `detection_records_status_idx`(`status`),
    INDEX `detection_records_test_time_idx`(`test_time`),
    UNIQUE INDEX `detection_records_manufacturer_code_device_sn_manufacturer_r_key`(`manufacturer_code`, `device_sn`, `manufacturer_record_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detection_record_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `detection_record_id` BIGINT NOT NULL,
    `test_item` VARCHAR(120) NOT NULL,
    `test_method` VARCHAR(120) NULL,
    `test_value` VARCHAR(120) NOT NULL,
    `unit` VARCHAR(40) NULL,
    `standard_limit` VARCHAR(255) NULL,
    `result` ENUM('pass', 'fail') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `detection_record_items_detection_record_id_idx`(`detection_record_id`),
    INDEX `detection_record_items_result_idx`(`result`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `detection_record_id` BIGINT NOT NULL,
    `issued_by_user_id` BIGINT NULL,
    `certificate_no` VARCHAR(40) NOT NULL,
    `public_token` VARCHAR(64) NOT NULL,
    `certificate_type` ENUM('agri_commitment_certificate', 'enterprise_quick_test_label') NOT NULL,
    `product_name` VARCHAR(120) NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
    `unit` VARCHAR(20) NOT NULL DEFAULT '批',
    `origin` VARCHAR(255) NULL,
    `issuer_name` VARCHAR(120) NOT NULL,
    `contact_phone` VARCHAR(30) NOT NULL,
    `commitment_basis` VARCHAR(255) NOT NULL,
    `status` ENUM('normal', 'voided') NOT NULL DEFAULT 'normal',
    `issue_time` DATETIME(3) NOT NULL,
    `void_time` DATETIME(3) NULL,
    `qr_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `certificates_certificate_no_key`(`certificate_no`),
    UNIQUE INDEX `certificates_public_token_key`(`public_token`),
    INDEX `certificates_company_id_idx`(`company_id`),
    INDEX `certificates_detection_record_id_idx`(`detection_record_id`),
    INDEX `certificates_certificate_type_idx`(`certificate_type`),
    INDEX `certificates_status_idx`(`status`),
    INDEX `certificates_issue_time_idx`(`issue_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `product_name` VARCHAR(120) NOT NULL,
    `default_origin` VARCHAR(255) NULL,
    `status` ENUM('normal', 'disabled') NOT NULL DEFAULT 'normal',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `products_status_idx`(`status`),
    UNIQUE INDEX `products_company_id_product_name_key`(`company_id`, `product_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `intro` TEXT NULL,
    `main_products` VARCHAR(500) NULL,
    `display_address` VARCHAR(255) NULL,
    `display_phone` VARCHAR(30) NULL,
    `is_public_enabled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_profiles_company_id_key`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_assets` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NULL,
    `biz_type` VARCHAR(60) NOT NULL,
    `file_type` VARCHAR(60) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `oss_key` VARCHAR(500) NOT NULL,
    `file_url` VARCHAR(1000) NOT NULL,
    `mime_type` VARCHAR(120) NULL,
    `file_size` BIGINT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `uploaded_by` VARCHAR(120) NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `file_assets_company_id_idx`(`company_id`),
    INDEX `file_assets_biz_type_idx`(`biz_type`),
    INDEX `file_assets_file_type_idx`(`file_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manufacturer_upload_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `manufacturer_code` VARCHAR(60) NOT NULL,
    `device_sn` VARCHAR(120) NULL,
    `manufacturer_record_id` VARCHAR(120) NULL,
    `request_payload` JSON NULL,
    `result` ENUM('success', 'duplicate', 'invalid_signature', 'unbound_device', 'validation_error', 'failed') NOT NULL,
    `error_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `manufacturer_upload_logs_manufacturer_code_idx`(`manufacturer_code`),
    INDEX `manufacturer_upload_logs_device_sn_idx`(`device_sn`),
    INDEX `manufacturer_upload_logs_manufacturer_record_id_idx`(`manufacturer_record_id`),
    INDEX `manufacturer_upload_logs_result_idx`(`result`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificate_print_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `certificate_id` BIGINT NOT NULL,
    `print_client` ENUM('miniapp', 'admin', 'system') NOT NULL,
    `adapter_type` VARCHAR(60) NULL,
    `print_status` ENUM('success', 'failed', 'simulated') NOT NULL,
    `copies` INTEGER NOT NULL DEFAULT 1,
    `error_message` VARCHAR(500) NULL,
    `printed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `certificate_print_logs_certificate_id_idx`(`certificate_id`),
    INDEX `certificate_print_logs_print_status_idx`(`print_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `operator_type` ENUM('admin', 'company_user', 'manufacturer', 'system') NOT NULL,
    `operator_id` BIGINT NULL,
    `target_type` VARCHAR(80) NOT NULL,
    `target_id` BIGINT NULL,
    `action` VARCHAR(80) NOT NULL,
    `content` VARCHAR(1000) NULL,
    `ip` VARCHAR(60) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `operation_logs_operator_type_idx`(`operator_type`),
    INDEX `operation_logs_operator_id_idx`(`operator_id`),
    INDEX `operation_logs_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `operation_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(120) NOT NULL,
    `setting_value` TEXT NOT NULL,
    `remark` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_setting_key_key`(`setting_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_users` ADD CONSTRAINT `company_users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_manufacturer_code_fkey` FOREIGN KEY (`manufacturer_code`) REFERENCES `manufacturer_interfaces`(`manufacturer_code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detection_records` ADD CONSTRAINT `detection_records_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detection_records` ADD CONSTRAINT `detection_records_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detection_record_items` ADD CONSTRAINT `detection_record_items_detection_record_id_fkey` FOREIGN KEY (`detection_record_id`) REFERENCES `detection_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_detection_record_id_fkey` FOREIGN KEY (`detection_record_id`) REFERENCES `detection_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_issued_by_user_id_fkey` FOREIGN KEY (`issued_by_user_id`) REFERENCES `company_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_profiles` ADD CONSTRAINT `company_profiles_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_assets` ADD CONSTRAINT `file_assets_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificate_print_logs` ADD CONSTRAINT `certificate_print_logs_certificate_id_fkey` FOREIGN KEY (`certificate_id`) REFERENCES `certificates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

