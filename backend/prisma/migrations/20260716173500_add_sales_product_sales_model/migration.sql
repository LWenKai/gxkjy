ALTER TABLE `sales_products`
  ADD COLUMN `sales_model` VARCHAR(80) NULL;

UPDATE `sales_products`
SET `sales_model` = CASE
  WHEN `category` = 'DETECTION_EQUIPMENT' AND `sort_order` = 10 THEN 'GX-INS-FS-MULTI-V1'
  WHEN `category` = 'DETECTION_EQUIPMENT' AND `sort_order` = 20 THEN 'GX-INS-NC-08-V1'
  WHEN `category` = 'DETECTION_EQUIPMENT' AND `sort_order` = 30 THEN 'GX-INS-JTK-01-V1'
  WHEN `category` = 'ENZYME_REAGENT' AND `sort_order` = 100 THEN 'GX-REAG-NC-500-V1'
  WHEN `category` = 'COLLOIDAL_GOLD_CARD' AND `sort_order` = 110 THEN 'GX-CARD-SR-100-V1'
  WHEN `category` = 'COLLOIDAL_GOLD_CARD' AND `sort_order` = 120 THEN 'GX-CARD-AFB1-100-V1'
  WHEN `category` = 'COLLOIDAL_GOLD_CARD' AND `sort_order` = 130 THEN 'GX-CARD-MG-100-V1'
  WHEN `category` = 'COLLOIDAL_GOLD_CARD' AND `sort_order` = 140 THEN 'GX-CARD-CAP-100-V1'
  WHEN `category` = 'LAB_CONSUMABLE' AND `sort_order` = 200 THEN 'GX-CONS-CUP-V1'
  WHEN `category` = 'LAB_CONSUMABLE' AND `sort_order` = 210 THEN 'GX-CONS-TIP-V1'
  WHEN `category` = 'LAB_CONSUMABLE' AND `sort_order` = 220 THEN 'GX-CONS-TUBE-V1'
  WHEN `category` = 'LAB_CONSUMABLE' AND `sort_order` = 230 THEN 'GX-CONS-BAG-V1'
  WHEN `category` = 'CERTIFICATE_PRINTER' AND `sort_order` = 300 THEN 'GX-PRT-CERT-K329-V1'
  WHEN `category` = 'PRINTING_CONSUMABLE' AND `sort_order` = 310 THEN 'GX-LABEL-CERT-6080-V1'
  WHEN `category` = 'DATA_TERMINAL' AND `sort_order` = 400 THEN 'GX-TERM-DATA-01-V1'
  WHEN `category` = 'SOFTWARE' AND `sort_order` = 500 THEN 'GX-SOFT-CLOUD-01Y-V1'
  WHEN `category` = 'SERVICE' AND `sort_order` = 600 THEN 'GX-SVC-INSTALL-01-V1'
  WHEN `category` = 'SERVICE' AND `sort_order` = 610 THEN 'GX-SVC-MAINTAIN-01-V1'
  ELSE `sales_model`
END
WHERE `sales_model` IS NULL
  AND `deleted_at` IS NULL;
