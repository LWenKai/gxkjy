const crypto = require('crypto');

const payload = {
  manufacturer_code: 'GXTEST',
  device_sn: 'GXDEMO001',
  manufacturer_record_id: 'REC202607120001',
  timestamp: 1783833600,
  nonce: 'abc123xyz',
  sample_name: '西红柿',
  product_name: '西红柿',
  test_time: '2026-07-12 10:30:00',
  result: 'qualified',
  items: [
    {
      item_name: '有机磷和氨基甲酸酯类农药残留',
      method: '酶抑制率法',
      value: '12.5',
      unit: '%',
      limit_value: '50',
      result: 'qualified',
      conclusion: '合格',
      raw_value: '12.5',
      reagent_batch: 'A20260701',
      remark: '',
    },
  ],
};

const secret = 'TEST_SECRET';
const signText = [
  `manufacturer_code=${payload.manufacturer_code}`,
  `device_sn=${payload.device_sn}`,
  `manufacturer_record_id=${payload.manufacturer_record_id}`,
  `nonce=${payload.nonce}`,
  `timestamp=${payload.timestamp}`,
].join('&');

payload.sign = crypto.createHmac('sha256', secret).update(signText).digest('hex');

console.log('Sign text:');
console.log(signText);
console.log('\nSign:');
console.log(payload.sign);
console.log('\nCurl example:');
console.log(`curl -X POST "https://api.gxkjy.com/api/open/detection/upload" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`);
