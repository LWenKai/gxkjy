# 谷芯快检云 API 说明

所有接口返回统一格式。

成功：

```json
{
  "success": true,
  "data": {},
  "message": "ok"
}
```

失败：

```json
{
  "success": false,
  "message": "错误说明",
  "code": "ERROR_CODE"
}
```

## 健康检查

```http
GET /api/health
```

返回示例：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "time": "2026-07-09T13:00:00.000Z",
    "database": "ok"
  },
  "message": "ok"
}
```

当数据库不可连接时，服务仍可启动，`database` 返回 `error`，`status` 返回 `degraded`。

## 后台管理员登录

```http
POST /api/admin/auth/login
Content-Type: application/json
```

请求：

```json
{
  "username": "admin",
  "password": "Guxin@2026"
}
```

成功返回：

```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "admin_user": {
      "id": "1",
      "username": "admin",
      "real_name": "超级管理员",
      "status": "normal",
      "last_login_at": "2026-07-09T13:00:00.000Z"
    }
  },
  "message": "ok"
}
```

失败返回统一错误，不区分账号不存在或密码错误：

```json
{
  "success": false,
  "message": "账号或密码错误",
  "code": "INVALID_CREDENTIALS"
}
```

接口不会返回 `password_hash`。

## 后续接口分组预留

- `/api/admin/*`：谷芯管理后台接口
- `/api/client/*`：客户微信小程序接口
- `/api/open/*`：厂家检测仪器上传接口
- `/api/public/*`：扫码公开页接口

## 第 2 步：后台基础业务 API

除 `POST /api/admin/auth/login` 和 `GET /api/health` 外，所有 `/api/admin/**` 接口都需要管理员 JWT：

```http
Authorization: Bearer <access_token>
```

列表接口统一分页参数：

```text
page=1&page_size=10
```

列表接口统一返回：

```json
{
  "success": true,
  "data": {
    "total": 1,
    "page": 1,
    "page_size": 10,
    "items": []
  },
  "message": "ok"
}
```

### 企业管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/companies` | 企业列表，支持 `name`、`status`、`page`、`page_size` |
| `POST` | `/api/admin/companies` | 新增企业 |
| `GET` | `/api/admin/companies/{id}` | 企业详情 |
| `PUT` | `/api/admin/companies/{id}` | 修改企业 |
| `POST` | `/api/admin/companies/{id}/enable` | 启用企业 |
| `POST` | `/api/admin/companies/{id}/disable` | 停用企业 |
| `POST` | `/api/admin/companies/{id}/renew` | 企业续期 |

新增企业请求字段：

```json
{
  "name": "测试企业",
  "contact_name": "张三",
  "phone": "13800000000",
  "address": "山西省长治市",
  "origin_address": "山西省长治市",
  "default_certificate_type": "enterprise_quick_test_label",
  "service_start_at": "2026-07-09T00:00:00+08:00",
  "service_expire_at": "2027-07-09T23:59:59+08:00",
  "status": "normal"
}
```

### 企业账号管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/companies/{companyId}/users` | 企业账号列表 |
| `POST` | `/api/admin/companies/{companyId}/users` | 创建企业账号 |
| `POST` | `/api/admin/company-users/{id}/reset-password` | 重置密码 |
| `POST` | `/api/admin/company-users/{id}/enable` | 启用账号 |
| `POST` | `/api/admin/company-users/{id}/disable` | 停用账号 |

创建账号时如不传 `password`，系统生成临时密码并仅在本次响应返回 `initial_password`。所有账号响应均不返回 `password_hash`。

### 厂家接口管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/manufacturer-interfaces` | 厂家接口列表，支持 `manufacturer_name`、`manufacturer_code`、`integration_type`、`status` |
| `POST` | `/api/admin/manufacturer-interfaces` | 新增厂家接口 |
| `GET` | `/api/admin/manufacturer-interfaces/{id}` | 厂家接口详情 |
| `PUT` | `/api/admin/manufacturer-interfaces/{id}` | 修改厂家接口 |
| `POST` | `/api/admin/manufacturer-interfaces/{id}/enable` | 启用厂家接口 |
| `POST` | `/api/admin/manufacturer-interfaces/{id}/disable` | 停用厂家接口 |

`manufacturer_code` 必须唯一。`access_secret` 可传入，也可由系统生成；系统生成时仅在创建响应返回 `access_secret_once`。列表和详情只返回 `access_secret_masked`，不返回明文密钥。

### 设备管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/devices` | 设备列表，支持 `company_id`、`manufacturer_code`、`status` |
| `POST` | `/api/admin/devices` | 新增设备 |
| `GET` | `/api/admin/devices/{id}` | 设备详情 |
| `PUT` | `/api/admin/devices/{id}` | 修改设备 |
| `POST` | `/api/admin/devices/{id}/bind` | 绑定企业 |
| `POST` | `/api/admin/devices/{id}/unbind` | 解绑企业 |
| `POST` | `/api/admin/devices/{id}/enable` | 启用设备 |
| `POST` | `/api/admin/devices/{id}/disable` | 停用设备 |

设备唯一约束为 `manufacturer_code + device_sn`。设备允许先新增后绑定企业，第一版不提供物理删除。

## 第 3 步：管理后台前端对接说明

管理后台前端位于 `admin-web`，通过 `VITE_API_BASE_URL` 配置后端 API 地址。

本阶段已对接接口：

| 页面 | 接口 | 说明 |
|---|---|---|
| 登录页 | `POST /api/admin/auth/login` | 后台管理员账号密码登录 |
| 企业列表 | `GET /api/admin/companies` | 企业分页、名称搜索、状态筛选 |
| 新增企业 | `POST /api/admin/companies` | 企业开户 |
| 编辑企业 | `PUT /api/admin/companies/{id}` | 企业基础资料维护 |
| 企业启用 | `POST /api/admin/companies/{id}/enable` | 启用企业 |
| 企业停用 | `POST /api/admin/companies/{id}/disable` | 停用企业 |
| 企业续期 | `POST /api/admin/companies/{id}/renew` | 只更新 `service_expire_at` |
| 企业详情 | `GET /api/admin/companies/{id}` | 查看企业基础信息 |
| 企业账号列表 | `GET /api/admin/companies/{companyId}/users` | 查看某企业账号 |
| 创建企业账号 | `POST /api/admin/companies/{companyId}/users` | 创建客户小程序登录账号 |
| 重置企业账号密码 | `POST /api/admin/company-users/{id}/reset-password` | 重置密码，可由后端生成临时密码 |
| 企业账号启用 | `POST /api/admin/company-users/{id}/enable` | 启用账号 |
| 企业账号停用 | `POST /api/admin/company-users/{id}/disable` | 停用账号 |

前端请求规则：

- 所有后台业务请求自动携带 `Authorization: Bearer <token>`。
- 后端返回 `success=false` 时统一弹出错误提示。
- HTTP `401` 或 token 失效时清理本地登录状态并跳转 `/login`。
- 企业账号列表不展示 `password_hash`。
- 厂家接口、设备管理、检测记录、合格证管理、系统设置当前为占位页面。
- 本阶段不开发检测数据上传、合格证生成、真实打印功能。

## 第 4 步：厂家接口和设备管理前端对接说明

管理后台已对接厂家接口管理页面 `/manufacturer-interfaces`：

| 页面操作 | 接口 | 说明 |
|---|---|---|
| 厂家接口列表 | `GET /api/admin/manufacturer-interfaces` | 支持厂家名称、厂家编码、对接方式、状态筛选 |
| 新增厂家接口 | `POST /api/admin/manufacturer-interfaces` | 可录入密钥，也可由后端生成 |
| 厂家接口详情 | `GET /api/admin/manufacturer-interfaces/{id}` | 只展示脱敏密钥 |
| 编辑厂家接口 | `PUT /api/admin/manufacturer-interfaces/{id}` | 厂家编码不在编辑时修改 |
| 启用厂家接口 | `POST /api/admin/manufacturer-interfaces/{id}/enable` | 二次确认 |
| 停用厂家接口 | `POST /api/admin/manufacturer-interfaces/{id}/disable` | 二次确认 |

厂家接口页面规则：

- `manufacturer_code` 在列表中明显展示。
- 列表不明文显示 `access_secret`。
- 新增接口时如后端返回 `access_secret_once`，前端只弹窗提示一次。
- 详情只展示 `access_secret_masked`。
- 对接方式支持 `http_api`、`mqtt`、`tcp_socket`，第一版主要使用 `http_api`。
- 签名规则默认 `HMAC-SHA256`。
- 页面不提供删除、联调工具、真实检测仪器连接测试。

管理后台已对接设备管理页面 `/devices`：

| 页面操作 | 接口 | 说明 |
|---|---|---|
| 设备列表 | `GET /api/admin/devices` | 支持厂家编码、绑定企业、状态筛选 |
| 新增设备 | `POST /api/admin/devices` | 设备可先新增后绑定企业 |
| 设备详情 | `GET /api/admin/devices/{id}` | 展示设备基础信息和绑定企业 |
| 编辑设备 | `PUT /api/admin/devices/{id}` | 维护厂家编码、设备编号、名称、型号、备注 |
| 绑定企业 | `POST /api/admin/devices/{id}/bind` | 从企业列表选择企业 |
| 解绑企业 | `POST /api/admin/devices/{id}/unbind` | 二次确认 |
| 启用设备 | `POST /api/admin/devices/{id}/enable` | 二次确认 |
| 停用设备 | `POST /api/admin/devices/{id}/disable` | 二次确认 |

设备管理页面规则：

- `manufacturer_code + device_sn` 在列表中明显展示。
- 未绑定企业显示“未绑定”标签。
- 已绑定企业显示企业名称。
- 绑定企业时复用 `GET /api/admin/companies` 选择企业。
- 企业详情页补充“已绑定设备”简单展示，并可跳转到设备管理页按企业筛选。
- 页面不提供删除、真实设备在线检测、真实数据上传测试、设备远程控制、真实打印功能。

## 第 5 步：合格证核心后端接口和测试检测数据

本阶段只提供后端接口，真实检测仪器上传、真实蓝牙打印、小程序页面和扫码 H5 页面暂不开发。

### 客户账号登录

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/client/auth/login` | 企业账号密码登录 |

登录成功返回 `access_token`、`company_user`、`company`。企业停用、账号停用、服务到期时不能登录；服务到期前 30 天返回 `expire_warning`。

### 后台测试检测记录

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/admin/test-detection-records` | 后台生成内测检测记录 |

该接口只用于内测。设备必须已绑定指定企业；系统会自动生成 `record_no` 和 `manufacturer_record_id`，并写入 `detection_records`、`detection_record_items`、`operation_logs`。

### 客户检测记录

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/client/detection-records` | 本企业检测记录列表，支持 `page`、`page_size`、`overall_result` |
| `GET` | `/api/client/detection-records/{id}` | 本企业检测记录详情，含检测项目明细 |
| `GET` | `/api/client/certifiable-records` | 本企业可开证记录，仅返回合格且状态正常的检测记录 |

`overall_result` 使用 `qualified / unqualified`。客户接口只能访问本企业数据。

### 客户合格证

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/client/certificates` | 基于合格检测记录生成合格证 |
| `GET` | `/api/client/certificates` | 本企业合格证列表，支持状态筛选 |
| `GET` | `/api/client/certificates/{id}` | 本企业合格证详情 |
| `POST` | `/api/client/certificates/{id}/void` | 作废本企业合格证 |
| `GET` | `/api/client/certificates/{id}/print-data` | 返回 60×80mm 标签结构化打印数据 |
| `POST` | `/api/client/certificates/{id}/print-logs` | 记录模拟打印日志 |

合格证编号规则为 `GX + YYYYMMDD + 6位日流水号`。`public_token` 使用 32 位随机不可猜测字符串。作废合格证不能获取打印数据，也不能写入新的打印日志。

### 后台查看接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/admin/detection-records` | 后台检测记录列表，支持企业、设备、结果、状态、日期筛选 |
| `GET` | `/api/admin/detection-records/{id}` | 后台检测记录详情 |
| `POST` | `/api/admin/detection-records/{id}/mark-abnormal` | 标记异常 |
| `POST` | `/api/admin/detection-records/{id}/hide` | 隐藏 |
| `POST` | `/api/admin/detection-records/{id}/void` | 作废检测记录 |
| `GET` | `/api/admin/certificates` | 后台合格证列表，支持企业、产品、状态、日期筛选 |
| `GET` | `/api/admin/certificates/{id}` | 后台合格证详情 |

后台只查看和软处理检测记录，不物理删除；后台只查看合格证，不生成、不重新打印、不删除。

## 第 6 步：客户微信小程序已对接接口

小程序接口地址通过 `VITE_API_BASE_URL` 配置，所有客户业务请求自动携带企业账号 `access_token`。接口返回 `401` 或登录失效时，小程序会清理本地登录状态并跳转客户登录页。

已对接接口：

| 页面 | 接口 | 说明 |
|---|---|---|
| 客户登录 | `POST /api/client/auth/login` | 保存 `access_token`、企业账号、企业信息；返回 `expire_warning` 时提示即将到期 |
| 首页 | `GET /api/client/detection-records`、`GET /api/client/certifiable-records` | 展示企业名称、今日检测数量、待开证数量、模拟打印提示 |
| 检测记录 | `GET /api/client/detection-records` | 本企业检测记录列表，支持全部/合格/不合格筛选 |
| 检测详情 | `GET /api/client/detection-records/{id}` | 展示检测项目明细；只有合格且状态正常才显示开证入口 |
| 开具合格证 | `GET /api/client/certifiable-records` | 只展示可开证检测记录 |
| 确认开证 | `POST /api/client/certificates` | 生成合格证，成功后进入合格证详情 |
| 已开证记录 | `GET /api/client/certificates` | 支持全部/正常/已作废筛选 |
| 合格证详情 | `GET /api/client/certificates/{id}` | 展示合格证、二维码链接、检测结果和项目明细 |
| 作废合格证 | `POST /api/client/certificates/{id}/void` | 二次确认后作废，作废后不显示模拟打印入口 |
| 标签预览 | `GET /api/client/certificates/{id}/print-data` | 读取 60×80mm 标签结构化数据，`adapter.real_print_enabled=false` |
| 模拟打印日志 | `POST /api/client/certificates/{id}/print-logs` | 只记录 success / failed 模拟打印结果 |

本阶段小程序不调用蓝牙 API，不接优博讯 K329 SDK，不包含扫码公开 H5，不提供后台管理入口，不允许客户修改或删除检测记录。
## 第 7 步：扫码公开 H5 与公开合格证接口

本阶段新增公开查询接口，供二维码扫码后的 H5 页面使用。该接口不需要登录，只允许通过 `public_token` 查询，不提供数据库 ID 查询方式。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/public/certificates/{publicToken}` | 查询公开合格证信息 |

正常返回结构：

```json
{
  "success": true,
  "data": {
    "valid": true,
    "status": "normal",
    "certificate": {},
    "detection": { "items": [] },
    "company": {
      "name": "企业名称",
      "intro": "企业简介",
      "main_products": "主营产品",
      "display_address": "展示地址",
      "display_phone": "展示电话",
      "images": [],
      "qualification_images": []
    },
    "support": {
      "provider_name": "山西谷芯科技有限公司",
      "support_text": "由谷芯快检云提供技术支持"
    },
    "notice": "本页面展示的检测数据来源于企业快检记录，用于日常自检、留档和合格证信息展示，不等同于第三方检验检测机构出具的检验报告。"
  },
  "message": "ok"
}
```

无效链接返回：

```json
{
  "success": true,
  "data": {
    "valid": false,
    "status": "invalid",
    "message": "未查询到对应合格证信息"
  },
  "message": "ok"
}
```

公开接口规则：

- 已作废合格证仍返回基础信息，但 `status` 为 `voided`，H5 必须明显提示“该合格证已作废”。
- `company_profiles.is_public_enabled=false` 时，不返回企业宣传资料、主营产品、展示地址、展示电话和图片。
- `file_assets.is_public=false` 的图片不会出现在公开接口中。
- 接口不返回客户账号、设备编号、厂家编码、厂家密钥、后台操作日志、打印日志等内部字段。
- `certificate_type=agri_commitment_certificate` 展示为“农产品质量安全承诺达标合格证”。
- `certificate_type=enterprise_quick_test_label` 展示为“企业快检合格标签”，页面文案需体现企业自检/快检属性。
## 第 8 步：后台检测记录和合格证管理页面

本阶段 admin-web 已对接后台查看接口，用于售后排查、客户服务、数据核对和问题处理。所有接口仍走后台管理员 JWT 鉴权，未登录或 token 无效会返回 `401` 并由前端跳转登录页。

### 后台检测记录管理页面

页面路由：`/detection-records`

| 页面操作 | 接口 | 说明 |
|---|---|---|
| 检测记录列表 | `GET /api/admin/detection-records` | 支持 `page`、`page_size`、`company_id`、`device_id`、`overall_result`、`status`、`date_from`、`date_to` |
| 检测记录详情 | `GET /api/admin/detection-records/{id}` | 展示检测记录基础信息、检测项目明细和默认折叠的原始数据 |
| 标记异常 | `POST /api/admin/detection-records/{id}/mark-abnormal` | 二次确认后处理，处理后不能用于开证 |
| 隐藏记录 | `POST /api/admin/detection-records/{id}/hide` | 二次确认后处理，处理后不能用于开证 |
| 作废记录 | `POST /api/admin/detection-records/{id}/void` | 二次确认后处理，处理后不能用于开证 |

页面不提供手动新增、编辑、物理删除、批量删除、Excel 导出、真实检测仪器上传测试或厂家联调入口。

### 后台合格证管理页面

页面路由：`/certificates`

| 页面操作 | 接口 | 说明 |
|---|---|---|
| 合格证列表 | `GET /api/admin/certificates` | 支持 `page`、`page_size`、`company_id`、`product_name`、`status`、`date_from`、`date_to` |
| 合格证详情 | `GET /api/admin/certificates/{id}` | 展示合格证信息、公开链接、对应检测记录、检测项目明细和打印日志 |

## 后台 CSV 导出接口

以下接口均需要后台管理员 JWT，导出内容受查询条件影响，返回 UTF-8 BOM CSV 文件。

| 模块 | 接口 | 说明 |
| --- | --- | --- |
| 企业管理 | `GET /api/admin/companies/export` | 导出企业名称、联系人、电话、地址、服务日期、状态、创建时间 |
| 设备管理 | `GET /api/admin/devices/export` | 导出设备名称、设备编号、厂家名称、绑定企业、状态、创建时间 |
| 检测记录 | `GET /api/admin/detection-records/export` | 导出记录编号、企业、样品、检测时间、结论、状态、项目数量、创建时间 |
| 合格证管理 | `GET /api/admin/certificates/export` | 导出合格证编号、企业、产品、数量、类型、状态、开证日期、扫码链接 |
| 产品库 | `GET /api/admin/products/export` | 导出企业、产品、类别、规格、产地、单位、状态、备注、创建时间 |
| 操作日志 | `GET /api/admin/operation-logs/export` | 导出操作人、模块、操作类型、摘要、IP、操作时间 |

导出文件不会包含 `password_hash`、JWT、OSS 密钥、厂家 `access_secret`、客户登录密码或内部 token。

页面支持复制和打开公开链接；不提供后台生成合格证、后台作废合格证、删除合格证、重新打印主入口、模板编辑器、批量导出或真实打印功能。

### 企业详情入口

`/companies/{id}` 企业详情页补充了两个简单跳转入口：

- 查看该企业检测记录：跳转 `/detection-records?company_id={id}`
- 查看该企业合格证记录：跳转 `/certificates?company_id={id}`
