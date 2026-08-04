# 检测仪上传接口 curl 测试示例

本文用于内部和厂家理解请求格式。示例密钥为 `TEST_SECRET`，不是生产密钥。

## 一、待签名字符串

```text
manufacturer_code=GXTEST&device_sn=GXDEMO001&manufacturer_record_id=REC202607120001&nonce=abc123xyz&timestamp=1783833600
```

签名算法：HMAC-SHA256，输出小写 hex。

## 二、Node.js 生成签名示例

```js
const crypto = require('crypto');

const secret = 'TEST_SECRET';
const signText = 'manufacturer_code=GXTEST&device_sn=GXDEMO001&manufacturer_record_id=REC202607120001&nonce=abc123xyz&timestamp=1783833600';
const sign = crypto.createHmac('sha256', secret).update(signText).digest('hex');

console.log(sign);
```

## 三、curl 示例

```bash
curl -X POST "https://api.gxkjy.com/api/open/detection/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturer_code": "GXTEST",
    "device_sn": "GXDEMO001",
    "manufacturer_record_id": "REC202607120001",
    "timestamp": 1783833600,
    "nonce": "abc123xyz",
    "sample_name": "西红柿",
    "product_name": "西红柿",
    "test_time": "2026-07-12 10:30:00",
    "result": "qualified",
    "items": [
      {
        "item_name": "有机磷和氨基甲酸酯类农药残留",
        "method": "酶抑制率法",
        "value": "12.5",
        "unit": "%",
        "limit_value": "50",
        "result": "qualified",
        "conclusion": "合格",
        "raw_value": "12.5",
        "reagent_batch": "A20260701",
        "remark": ""
      }
    ],
    "sign": "这里填写上一步生成的签名"
  }'
```

## 四、注意

1. 示例只用于说明格式；
2. 不要把真实 `access_secret` 写进命令、文档或聊天记录；
3. 如果真实接口尚未上线，curl 会返回 404 或接口不存在，这是正常的；
4. 联调前由谷芯提供测试厂家编码、设备编号和测试密钥。

