-- Clean up known legacy internal model values that do not follow the new naming rule.
UPDATE sales_products
SET model = 'GX-NE16MS', sales_model = NULL
WHERE deleted_at IS NULL
  AND category = 'DETECTION_EQUIPMENT'
  AND model = 'GX-NC16ST';
