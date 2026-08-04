# 谷芯快检云测试环境部署说明

本文档用于第一版 MVP 部署到阿里云测试环境。部署形态为：阿里云 ECS 单台服务器 + Docker Compose + MySQL + Nginx + HTTPS + 阿里云 OSS。

本阶段不包含真实检测仪器厂家联调、真实检测数据上传接口、真实蓝牙打印、优博讯 K329 SDK、复杂权限、复杂统计大屏、Excel 导出、客户自定义模板和后台删除数据功能。

## 1. 阿里云 ECS 基础准备

建议测试环境配置：

- 操作系统：Ubuntu 22.04 LTS 或 Alibaba Cloud Linux 3
- CPU/内存：2 核 4GB 起步
- 系统盘：40GB 起步
- 安全组开放端口：`22`、`80`、`443`
- 不建议对公网开放 MySQL `3306`

安全提醒：

- 后台管理域名 `admin.xxx.com` 不要随意公开传播。
- 测试环境和正式环境必须使用不同的数据库密码、JWT 密钥和 OSS AccessKey。
- `.env` 不能提交到代码仓库。

## 2. 安装 Docker 和 Docker Compose

Ubuntu 示例：

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version
docker compose version
```

## 3. 上传项目代码

示例目录：

```bash
sudo mkdir -p /opt/gxkjy
sudo chown -R $USER:$USER /opt/gxkjy
cd /opt/gxkjy
```

可以通过 Git、SCP 或压缩包上传项目代码。上传后确认目录中包含：

- `backend`
- `admin-web`
- `miniapp`
- `public-h5`
- `deploy`
- `.env.example`
- `package.json`

## 4. 配置 .env

```bash
cd /opt/gxkjy
cp .env.example .env
vi .env
```

必须修改：

```text
NODE_ENV=production
APP_PORT=3000
BACKEND_PORT=3000

API_DOMAIN=api.xxx.com
ADMIN_DOMAIN=admin.xxx.com
CERT_DOMAIN=cert.xxx.com
API_BASE_URL=https://api.xxx.com/api
ADMIN_WEB_BASE_URL=https://admin.xxx.com
CERT_PUBLIC_BASE_URL=https://cert.xxx.com
PUBLIC_CERT_BASE_URL=https://cert.xxx.com

MYSQL_DATABASE=guxin_quick_test
MYSQL_USER=guxin
MYSQL_PASSWORD=替换为强密码
MYSQL_ROOT_PASSWORD=替换为强密码
DATABASE_URL=mysql://guxin:替换为强密码@127.0.0.1:3306/guxin_quick_test
DATABASE_URL_DOCKER=mysql://guxin:替换为强密码@mysql:3306/guxin_quick_test

JWT_SECRET=替换为高强度随机字符串
JWT_EXPIRES_IN=7d

ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD=部署前替换默认密码

VITE_API_BASE_URL=https://api.xxx.com/api
VITE_CERT_PUBLIC_BASE_URL=https://cert.xxx.com

OSS_REGION=oss-cn-你的地域
OSS_ENDPOINT=https://oss-cn-你的地域.aliyuncs.com
OSS_BUCKET=你的Bucket名称
OSS_ACCESS_KEY_ID=不要提交代码仓库
OSS_ACCESS_KEY_SECRET=不要提交代码仓库
OSS_PUBLIC_BASE_URL=https://你的Bucket名称.oss-cn-你的地域.aliyuncs.com

BACKUP_DIR=/backup
BACKUP_RETENTION_DAYS=14
```

重要提醒：

- `JWT_SECRET` 必须使用高强度随机字符串。
- `MYSQL_PASSWORD` 和 `MYSQL_ROOT_PASSWORD` 必须使用强密码。
- `admin / Guxin@2026` 只允许本地测试使用，部署前必须修改。
- OSS AccessKey 只能放在服务器 `.env`，不要提交到代码仓库。

## 5. 配置域名和 HTTPS 证书

准备三个域名：

- `api.xxx.com`：后端 API
- `admin.xxx.com`：管理后台
- `cert.xxx.com`：扫码公开 H5

将域名 A 记录解析到 ECS 公网 IP。

证书文件放到：

```text
/opt/gxkjy/deploy/nginx/certs/
```

文件名建议：

```text
api.xxx.com.pem
api.xxx.com.key
admin.xxx.com.pem
admin.xxx.com.key
cert.xxx.com.pem
cert.xxx.com.key
```

将 `deploy/nginx/https.template.conf` 复制为正式 Nginx 配置：

```bash
cp deploy/nginx/https.template.conf deploy/nginx/default.conf
```

把配置中的 `api.xxx.com`、`admin.xxx.com`、`cert.xxx.com` 和证书文件名替换为真实域名。

Nginx 配置要点：

- HTTP `80` 自动跳转 HTTPS。
- `api.xxx.com` 代理到 `backend:3000`。
- `admin.xxx.com` 代理到 `admin-web:80`，静态容器支持 history 路由。
- `cert.xxx.com` 代理到 `public-h5:80`，静态容器支持 `/c/{publicToken}` 刷新不 404。
- `client_max_body_size` 预留为 `20m`。
- 不暴露容器内部路径。

## 6. 启动 MySQL

```bash
docker compose --env-file .env -f deploy/docker-compose.yml up -d mysql
docker compose --env-file .env -f deploy/docker-compose.yml ps mysql
```

查看日志：

```bash
docker compose --env-file .env -f deploy/docker-compose.yml logs -f mysql
```

## 7. 执行 Prisma migration

如果服务器上直接安装了 Node.js 和 pnpm，可以在宿主机执行：

```bash
pnpm install
pnpm --filter @guxin/backend exec prisma migrate deploy --schema prisma/schema.prisma
```

如果只使用 Docker，可进入后端容器执行。首次构建后：

```bash
docker compose --env-file .env -f deploy/docker-compose.yml build backend
docker compose --env-file .env -f deploy/docker-compose.yml run --rm backend npx prisma migrate deploy --schema prisma/schema.prisma
```

## 8. 执行 seed

```bash
pnpm --filter @guxin/backend prisma:seed
```

或容器方式：

```bash
docker compose --env-file .env -f deploy/docker-compose.yml run --rm backend node dist/prisma/seed.js
```

如果容器 seed 命令因构建路径不同不可用，建议在 ECS 安装 Node.js/pnpm 后使用宿主机命令执行 seed。seed 可重复执行，已存在 `admin` 时不会重复创建。

## 9. 构建 admin-web、public-h5、miniapp

Docker Compose 会在构建镜像时构建 `admin-web` 和 `public-h5`：

```bash
docker compose --env-file .env -f deploy/docker-compose.yml build admin-web public-h5
```

本地或服务器手动构建：

```bash
pnpm --filter @guxin/admin-web build
pnpm --filter @guxin/public-h5 build
pnpm --filter @guxin/miniapp build:mp-weixin
```

小程序构建产物：

```text
miniapp/dist/build/mp-weixin
```

用微信开发者工具导入该目录，配置体验版或上传审核。

## 10. 启动 backend 和 Nginx

```bash
docker compose --env-file .env -f deploy/docker-compose.yml up -d backend admin-web public-h5 nginx
docker compose --env-file .env -f deploy/docker-compose.yml ps
```

查看日志：

```bash
docker compose --env-file .env -f deploy/docker-compose.yml logs -f backend
docker compose --env-file .env -f deploy/docker-compose.yml logs -f nginx
```

## 11. 配置 MySQL 自动备份

备份脚本：

```text
deploy/backup/backup-mysql.sh
```

手动备份：

```bash
docker compose --env-file .env -f deploy/docker-compose.yml --profile backup run --rm mysql-backup
```

备份文件会保存到：

```text
deploy/backup/
```

文件名包含日期时间，例如：

```text
guxin_quick_test_20260710143000.sql.gz
```

配置每日凌晨 2 点自动备份：

```bash
crontab -e
```

加入：

```cron
0 2 * * * cd /opt/gxkjy && docker compose --env-file .env -f deploy/docker-compose.yml --profile backup run --rm mysql-backup >> deploy/backup/backup.log 2>&1
```

恢复备份示例：

```bash
gunzip -c deploy/backup/guxin_quick_test_YYYYMMDDHHMMSS.sql.gz | \
docker exec -i guxin-mysql mysql -u guxin -p你的数据库密码 guxin_quick_test
```

建议部署后至少做一次备份恢复演练。

## 12. 验证接口和页面

健康检查：

```bash
curl https://api.xxx.com/api/health
```

期望返回：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "ok"
  },
  "message": "ok"
}
```

后台登录：

```bash
curl -X POST https://api.xxx.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"你的部署密码"}'
```

浏览器访问：

- `https://admin.xxx.com/login`
- `https://cert.xxx.com/c/{publicToken}`

## 13. 小程序部署前注意事项

- 微信小程序后台需要配置合法请求域名：`https://api.xxx.com`
- 请求域名必须 HTTPS。
- 测试阶段可使用微信开发者工具和体验版。
- `miniapp/.env` 中的 `VITE_API_BASE_URL` 必须指向测试环境 API：`https://api.xxx.com/api`
- 当前小程序为模拟打印，不包含真实蓝牙打印。
- 当前不接优博讯 K329 SDK。
- 小程序发布前需要完成微信小程序认证和审核。

## 14. 常见问题排查

### /api/health 访问失败

- 检查安全组是否开放 `443`。
- 检查 Nginx 是否启动。
- 检查 `api.xxx.com` 是否解析到 ECS。
- 查看后端日志：`docker compose --env-file .env -f deploy/docker-compose.yml logs -f backend`

### 后台页面刷新 404

- 确认 `admin-web` 镜像使用了 `deploy/nginx/static-spa.conf`。
- 重新构建：`docker compose --env-file .env -f deploy/docker-compose.yml build admin-web`

### 扫码公开页 /c/token 刷新 404

- 确认 `public-h5` 镜像使用了 `deploy/nginx/static-spa.conf`。
- 重新构建：`docker compose --env-file .env -f deploy/docker-compose.yml build public-h5`

### 数据库连接失败

- 检查 `DATABASE_URL_DOCKER` 是否使用 `mysql` 作为主机名。
- 检查 MySQL 容器是否 healthy。
- 检查 `.env` 中数据库密码是否一致。

### 小程序请求失败

- 检查小程序后台合法域名。
- 检查 `VITE_API_BASE_URL` 是否为 HTTPS。
- 检查 API 证书是否有效。

## 15. 部署前安全清单

- 必须修改默认管理员密码。
- 必须替换 `JWT_SECRET`。
- 必须替换 MySQL 密码。
- OSS 密钥不能提交代码。
- `.env` 不能提交代码。
- 安全组只开放必要端口。
- 数据库必须定期备份。
- 测试环境和正式环境密钥必须分开。
