export const salesProductCategoryOptions = [
  { label: '检测仪器', value: 'DETECTION_EQUIPMENT' },
  { label: '农残酶试剂', value: 'ENZYME_REAGENT' },
  { label: '胶体金检测卡', value: 'COLLOIDAL_GOLD_CARD' },
  { label: '取样及实验耗材', value: 'LAB_CONSUMABLE' },
  { label: '合格证打印设备', value: 'CERTIFICATE_PRINTER' },
  { label: '标签纸及打印耗材', value: 'PRINTING_CONSUMABLE' },
  { label: '数据上传终端', value: 'DATA_TERMINAL' },
  { label: '软件平台', value: 'SOFTWARE' },
  { label: '安装培训维修服务', value: 'SERVICE' },
  { label: '其他', value: 'OTHER' },
];

export const paymentStatusOptions = [
  { label: '未付款', value: 'UNPAID' },
  { label: '已付款', value: 'PAID' },
  { label: '部分付款', value: 'PARTIALLY_PAID' },
  { label: '已退款', value: 'REFUNDED' },
];

export const deliveryStatusOptions = [
  { label: '待采购', value: 'PENDING' },
  { label: '采购中', value: 'PURCHASING' },
  { label: '待发货', value: 'READY_TO_SHIP' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已完成', value: 'DELIVERED' },
  { label: '已取消', value: 'CANCELLED' },
];

export const repurchaseStatusOptions = [
  { label: '待提醒', value: 'PENDING' },
  { label: '已联系', value: 'CONTACTED' },
  { label: '已补货', value: 'REPURCHASED' },
  { label: '暂不需要', value: 'NO_NEED' },
  { label: '不再提醒', value: 'CANCELLED' },
];

export const salesQuoteStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已生成', value: 'GENERATED' },
  { label: '已发送', value: 'SENT' },
  { label: '客户确认中', value: 'CONFIRMING' },
  { label: '已接受', value: 'ACCEPTED' },
  { label: '未成交', value: 'LOST' },
  { label: '已失效', value: 'EXPIRED' },
  { label: '已被新版本替代', value: 'SUPERSEDED' },
];

export function salesOptionLabel(
  options: Array<{ label: string; value: string }>,
  value?: string | null,
) {
  return options.find((item) => item.value === value)?.label || value || '-';
}
