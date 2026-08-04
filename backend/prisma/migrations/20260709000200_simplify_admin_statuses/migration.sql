-- Align first-version admin API statuses with the MVP requirement.
ALTER TABLE `companies`
  MODIFY `default_certificate_type` ENUM('agri_commitment_certificate', 'enterprise_quick_test_label')
  NOT NULL DEFAULT 'enterprise_quick_test_label';

ALTER TABLE `manufacturer_interfaces`
  MODIFY `status` ENUM('normal', 'disabled')
  NOT NULL DEFAULT 'normal';

ALTER TABLE `devices`
  MODIFY `status` ENUM('normal', 'disabled')
  NOT NULL DEFAULT 'normal';
