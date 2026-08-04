-- Fallback updates for early default sales products whose names may have been edited.
UPDATE sales_products SET model = 'GX-ZP20MS', sales_model = NULL WHERE deleted_at IS NULL AND product_no = 'SP000002';
UPDATE sales_products SET model = 'GX-NE12MS', sales_model = NULL WHERE deleted_at IS NULL AND product_no = 'SP000003';
UPDATE sales_products SET model = 'GX-ZGXMS', sales_model = NULL WHERE deleted_at IS NULL AND product_no = 'SP000004';
UPDATE sales_products SET model = 'GX-PR-6080B', sales_model = NULL WHERE deleted_at IS NULL AND product_no = 'SP000013';

UPDATE sales_products SET model = 'GX-ZP20MS', sales_model = NULL WHERE deleted_at IS NULL AND category = 'DETECTION_EQUIPMENT' AND sort_order = 10;
UPDATE sales_products SET model = 'GX-NE12MS', sales_model = NULL WHERE deleted_at IS NULL AND category = 'DETECTION_EQUIPMENT' AND sort_order = 20;
UPDATE sales_products SET model = 'GX-ZGXMS', sales_model = NULL WHERE deleted_at IS NULL AND category = 'DETECTION_EQUIPMENT' AND sort_order = 30;
UPDATE sales_products SET model = 'GX-PR-6080B', sales_model = NULL WHERE deleted_at IS NULL AND category = 'CERTIFICATE_PRINTER' AND sort_order = 300;
