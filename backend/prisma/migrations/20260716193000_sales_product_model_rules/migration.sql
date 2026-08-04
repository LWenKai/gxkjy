-- Keep the old sales_model column for compatibility, but stop using it in the UI.
UPDATE sales_products
SET sales_model = NULL
WHERE deleted_at IS NULL;

-- Remove self-brand text from sales products. The field is now used only for real manufacturer names.
UPDATE sales_products
SET brand = NULL
WHERE deleted_at IS NULL
  AND brand IN ('谷芯', '谷芯科技', '山西谷芯科技有限公司');

-- Default product model rules for Guxin internal sales products.
UPDATE sales_products SET model = 'GX-ZP20MS' WHERE deleted_at IS NULL AND name = '食品安全综合检测仪';
UPDATE sales_products SET model = 'GX-NE12MS' WHERE deleted_at IS NULL AND name = '农药残留快速检测仪';
UPDATE sales_products SET model = 'GX-ZGXMS' WHERE deleted_at IS NULL AND name = '胶体金读卡仪';
UPDATE sales_products SET model = 'GX-RE-NC500' WHERE deleted_at IS NULL AND name = '农残检测酶试剂';
UPDATE sales_products SET model = 'GX-CG-SR3' WHERE deleted_at IS NULL AND name = '瘦肉精三联检测卡';
UPDATE sales_products SET model = 'GX-CG-AFB1' WHERE deleted_at IS NULL AND name = '黄曲霉毒素B1检测卡';
UPDATE sales_products SET model = 'GX-CG-MG' WHERE deleted_at IS NULL AND name = '孔雀石绿检测卡';
UPDATE sales_products SET model = 'GX-CG-CAP' WHERE deleted_at IS NULL AND name = '氯霉素检测卡';
UPDATE sales_products SET model = 'GX-LC-CUP' WHERE deleted_at IS NULL AND name = '样品杯';
UPDATE sales_products SET model = 'GX-LC-TIP' WHERE deleted_at IS NULL AND name = '移液枪枪头';
UPDATE sales_products SET model = 'GX-LC-TUBE' WHERE deleted_at IS NULL AND name = '离心管';
UPDATE sales_products SET model = 'GX-LC-BAG' WHERE deleted_at IS NULL AND name = '取样袋';
UPDATE sales_products SET model = 'GX-PR-6080B' WHERE deleted_at IS NULL AND name = '优博讯K329便携标签打印机';
UPDATE sales_products SET model = 'GX-LB-6080' WHERE deleted_at IS NULL AND name = '60×80mm合格证标签纸';
UPDATE sales_products SET model = 'GX-DT-S01' WHERE deleted_at IS NULL AND name = '数据上传终端';
UPDATE sales_products SET model = 'GX-SW-QJY-1Y' WHERE deleted_at IS NULL AND name = '谷芯快检云年服务';
UPDATE sales_products SET model = 'GX-SV-INST' WHERE deleted_at IS NULL AND name = '快检室安装培训服务';
UPDATE sales_products SET model = 'GX-SV-CAL' WHERE deleted_at IS NULL AND name = '检测仪维护校准服务';
