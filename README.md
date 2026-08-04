# 谷芯快检云

谷芯快检云第一版 MVP 项目，技术栈为 NestJS + Prisma + MySQL + Vue3 + uni-app。第一版目标是跑通：后台开户、企业账号、设备绑定、测试检测记录、客户开证、标签预览、模拟打印、扫码公开页和后台查看。

当前不包含真实检测仪器厂家联调、真实检测数据上传、真实蓝牙打印、优博讯 K329 SDK、复杂权限、复杂统计大屏、Excel 导出和后台删除数据功能。

## 子项目说明

- `backend`：后端 API，NestJS + Prisma。
- `admin-web`：谷芯管理后台，Vue3 + Vite + Element Plus。
- `miniapp`：客户微信小程序，uni-app + Vue3 + TypeScript。
- `public-h5`：扫码公开页，Vue3 + Vite。
- `packages/shared`：共享类型和工具预留。
- `packages/print-core`：打印数据结构和适配层预留。
- `deploy`：Docker Compose、Nginx、MySQL、备份脚本。
- `docs`：接口、数据库、部署和测试文档。

## 本地开发启动

复制环境变量：

```powershell
Copy-Item .env.example .env
Copy-Item admin-web/.env.example admin-web/.env
Copy-Item miniapp/.env.example miniapp/.env
Copy-Item public-h5/.env.example public-h5/.env
```

安装依赖：

```powershell
pnpm install
```

启动 MySQL 后执行迁移和 seed：

```powershell
pnpm --filter @guxin/backend exec prisma migrate deploy --schema prisma/schema.prisma
pnpm --filter @guxin/backend prisma:seed
```

启动后端：

```powershell
pnpm dev:backend
```

启动管理后台：

```powershell
pnpm dev:admin
```

启动扫码公开页：

```powershell
pnpm dev:public
```

小程序开发：

```powershell
pnpm dev:miniapp
```

## 常用构建命令

```powershell
pnpm --filter @guxin/backend build
pnpm --filter @guxin/admin-web build
pnpm --filter @guxin/miniapp build:mp-weixin
pnpm --filter @guxin/public-h5 build
```

## 测试检查命令

```powershell
pnpm smoke:https
pnpm cert:check
```

`smoke:https` 用于检查正式测试域名、公开页和 demo 客户接口链路；`cert:check` 用于检查 HTTPS 证书剩余有效期。

微信开发者工具导入目录：

```text
D:\gxkjy\miniapp\dist\build\mp-weixin
```

## 数据库命令

执行 migration：

```powershell
pnpm --filter @guxin/backend exec prisma migrate deploy --schema prisma/schema.prisma
```

执行 seed：

```powershell
pnpm --filter @guxin/backend prisma:seed
```

默认后台管理员仅用于本地测试：

```text
账号：admin
密码：Guxin@2026
```

正式部署前必须修改默认管理员密码，并替换 `.env` 中的 `ADMIN_INIT_PASSWORD`。

## 测试环境部署入口

部署文档：

```text
docs/部署说明：docs/deploy.md
docs/部署检查清单：docs/谷芯快检云测试环境部署检查清单.md
```

部署形态：

```text
阿里云 ECS 单台服务器 + Docker Compose + MySQL + Nginx + HTTPS + OSS
```

部署命令入口：

```bash
cp .env.example .env
docker compose --env-file .env -f deploy/docker-compose.yml up -d mysql
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build backend admin-web public-h5 nginx
```

## 环境变量提醒

不要提交以下文件：

- `.env`
- `.env.local`
- 任何包含真实密码、JWT 密钥、OSS AccessKey 的文件
- HTTPS 证书私钥

正式部署前必须修改：

- `JWT_SECRET`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `ADMIN_INIT_PASSWORD`
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`

## 小程序部署前说明

- 小程序后台需要配置合法请求域名。
- 请求域名必须 HTTPS，例如 `https://api.xxx.com`。
- `miniapp/.env` 中 `VITE_API_BASE_URL` 需要指向测试环境 API。
- 测试阶段可使用微信开发者工具和体验版。
- 当前小程序只做模拟打印，真实蓝牙打印后置。
- 小程序发布前需要完成微信小程序认证和审核。
