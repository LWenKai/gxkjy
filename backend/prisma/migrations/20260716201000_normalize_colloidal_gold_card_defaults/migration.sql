UPDATE sales_products
SET
  unit = '盒',
  specification = COALESCE(specification, '10条/盒，胶体金快速检测卡，适用样品和判定规则以实际产品说明为准'),
  description = COALESCE(description, '10条/盒，胶体金快速检测卡，适用样品和判定规则以实际产品说明为准'),
  default_sale_price = COALESCE(default_sale_price, 59.00),
  reference_cost_price = COALESCE(reference_cost_price, 25.00),
  repeat_reminder_enabled = 1,
  reference_cycle_days = COALESCE(reference_cycle_days, 60),
  default_reminder_days_before = COALESCE(default_reminder_days_before, 7),
  sales_model = NULL
WHERE deleted_at IS NULL
  AND category = 'COLLOIDAL_GOLD_CARD';
