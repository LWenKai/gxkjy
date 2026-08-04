export const customerTypeOptions = [
  { label: '食材配送企业', value: 'DELIVERY_COMPANY' },
  { label: '食品加工企业', value: 'FOOD_PROCESSING' },
  { label: '农产品合作社', value: 'COOPERATIVE' },
  { label: '农产品基地', value: 'FARM_BASE' },
  { label: '食堂/餐饮', value: 'CANTEEN' },
  { label: '农贸市场', value: 'MARKET' },
  { label: '政府监管单位', value: 'GOVERNMENT' },
  { label: '其他', value: 'OTHER' },
];

export const customerSourceOptions = [
  { label: '抖音获客', value: 'DOUYIN' },
  { label: '微信咨询', value: 'WECHAT' },
  { label: '老客户', value: 'OLD_CUSTOMER' },
  { label: '政府关系', value: 'GOVERNMENT_RELATION' },
  { label: '厂家转介绍', value: 'SUPPLIER_REFERRAL' },
  { label: '主动开发', value: 'ACTIVE_DEVELOP' },
  { label: '其他', value: 'OTHER' },
];

export const customerStatusOptions = [
  { label: '新线索', value: 'NEW' },
  { label: '已联系', value: 'CONTACTED' },
  { label: '已了解需求', value: 'NEED_CONFIRMED' },
  { label: '已报价', value: 'QUOTED' },
  { label: '谈判中', value: 'NEGOTIATING' },
  { label: '已成交', value: 'WON' },
  { label: '长期维护', value: 'FOLLOW_UP' },
  { label: '暂无需求', value: 'LOST' },
];

export const customerValueOptions = [
  { label: '项目型客户', value: 'PROJECT' },
  { label: '耗材复购客户', value: 'REPEAT' },
  { label: '普通咨询客户', value: 'NORMAL' },
  { label: '待判断', value: 'UNKNOWN' },
];

export const customerNeedOptions = [
  { label: '快检设备', value: 'EQUIPMENT' },
  { label: '快检室建设', value: 'LAB_BUILD' },
  { label: '耗材', value: 'CONSUMABLE' },
  { label: '合格证配套', value: 'CERTIFICATE' },
  { label: '维修升级', value: 'REPAIR' },
];

export const followTypeOptions = [
  { label: '电话', value: 'PHONE' },
  { label: '微信', value: 'WECHAT' },
  { label: '上门', value: 'VISIT' },
  { label: '其他', value: 'OTHER' },
];

export const quoteStatusOptions = [
  { label: '等待确认', value: 'WAITING' },
  { label: '跟进中', value: 'FOLLOWING' },
  { label: '成交', value: 'SUCCESS' },
  { label: '未成交', value: 'FAILED' },
];

export function optionLabel(
  options: Array<{ label: string; value: string }>,
  value?: string | null,
) {
  return options.find((item) => item.value === value)?.label || value || '-';
}
