# 谷芯快检云数据库说明

第一版数据库采用 MySQL 8，使用 Prisma 管理模型和迁移。

## 迁移文件

当前初始化迁移：

```text
backend/prisma/migrations/20260709000100_init_core_schema/migration.sql
backend/prisma/migrations/20260709000200_simplify_admin_statuses/migration.sql
```

执行方式：

```bash
pnpm --filter @guxin/backend prisma:generate
pnpm --filter @guxin/backend exec prisma migrate deploy --schema prisma/schema.prisma
```

开发环境也可以使用：

```bash
pnpm --filter @guxin/backend prisma:migrate
```

## 核心表

| 表名 | 说明 |
|---|---|
| `admin_users` | 谷芯后台管理员账号，第一版只初始化一个超级管理员 |
| `companies` | 企业主表，包含服务到期时间和默认证书类型 |
| `company_users` | 企业客户账号，`username` 唯一 |
| `manufacturer_interfaces` | 检测仪器厂家接口配置 |
| `devices` | 设备表，`manufacturer_code + device_sn` 唯一 |
| `detection_records` | 检测记录主表，来自厂家接口上传 |
| `detection_record_items` | 检测项目明细 |
| `certificates` | 合格证表，`certificate_no` 和 `public_token` 唯一 |
| `products` | 企业常用产品 |
| `company_profiles` | 企业公开展示资料 |
| `file_assets` | OSS 文件记录，数据库只保存 URL、OSS key、类型等信息 |
| `manufacturer_upload_logs` | 厂家上传日志，未绑定设备、签名失败等异常也写入这里 |
| `certificate_print_logs` | 打印日志 |
| `operation_logs` | 后台和系统操作日志 |
| `system_settings` | 系统配置 |

## 关键约束

- 合格证类型 `certificate_type`：
  - `agri_commitment_certificate`
  - `enterprise_quick_test_label`
- 合格证编号 `certificate_no`：预留唯一索引，格式后续业务实现为 `GX + YYYYMMDD + 6位流水号`。
- 公开令牌 `public_token`：预留唯一索引，必须使用 16-32 位随机不可猜测字符串。
- 检测上传去重：`manufacturer_code + device_sn + manufacturer_record_id` 唯一。
- 检测记录不做物理删除，后续只允许 `normal / marked_abnormal / hidden / voided` 软状态处理。

## 第 2 步状态枚举约定

第一版后台基础业务 API 使用尽量少的状态，避免过度设计：

| 表 | 字段 | 可选值 | 说明 |
|---|---|---|---|
| `admin_users` | `status` | `normal` / `disabled` | 后台管理员状态 |
| `companies` | `status` | `normal` / `disabled` | 企业启用或停用 |
| `company_users` | `status` | `normal` / `disabled` | 企业账号启用或停用 |
| `manufacturer_interfaces` | `status` | `normal` / `disabled` | 厂家接口启用或停用 |
| `devices` | `status` | `normal` / `disabled` | 设备启用或停用 |

后台企业、企业账号、厂家接口、设备均不做物理删除。新增、修改、启用、停用、续期、绑定、解绑等操作写入 `operation_logs`。

敏感字段规则：

- `company_users.password_hash` 只存储 bcrypt 哈希，接口不返回。
- `manufacturer_interfaces.access_secret` 数据库存储明文接入密钥，列表和详情接口只返回脱敏值。
- 设备唯一约束为 `manufacturer_code + device_sn`。

## 第 5 步补充规则

- 检测结果接口值使用 `qualified / unqualified`，数据库内部枚举仍为 `pass / fail`。
- 检测记录状态：`normal / marked_abnormal / hidden / voided`。只有 `normal + pass` 的检测记录可开证。
- 合格证状态：`normal / voided`。作废后不能打印，但原检测记录仍可重新开证。
- 合格证编号：`GX + YYYYMMDD + 6位日流水号`，例如 `GX202607100001`。流水按开具日期每日从 1 开始递增。
- `public_token`：使用 32 位随机十六进制字符串，存入 `certificates.public_token`，唯一且不可由数据库 ID 或合格证编号推导。
- `qr_url`：由 `PUBLIC_CERT_BASE_URL` 和 `public_token` 生成，第一版默认占位域名为 `https://cert.xxx.com/certificates/{public_token}`。
- `certificate_print_logs` 当前只记录模拟打印结果，`print_client=miniapp`，`adapter_type=simulated`，不接入真实蓝牙打印。
- 后台测试检测记录接口写入正式检测记录表，但 `raw_payload_json.source=admin_test_generation`，用于无真实仪器时跑通内部流程。

## 第 6 步后端细节确认

- 合格证编号中的 `YYYYMMDD` 按中国业务日期生成，固定使用 `Asia/Shanghai`，不受服务器 UTC 日期影响。
- 每日流水统计范围为北京时间当天 `00:00:00` 至次日 `00:00:00`。
- 二维码公开域名优先读取 `CERT_PUBLIC_BASE_URL`，并兼容旧变量 `PUBLIC_CERT_BASE_URL`；默认值为 `https://cert.xxx.com`。
- `print-data.adapter.real_print_enabled` 固定返回 `false`，用于明确当前阶段只支持模拟打印。
