# 第16步 gxkjy 域名 HTTPS 配置与验证记录

## 1. DNS 检查结果

已检查以下域名，均解析到服务器公网 IP `182.92.75.122`：

- `api.gxkjy.com -> 182.92.75.122`
- `admin.gxkjy.com -> 182.92.75.122`
- `cert.gxkjy.com -> 182.92.75.122`

## 2. HTTPS 证书方案

采用 Let’s Encrypt 免费证书，使用服务器上的 `certbot` 申请一张包含三个域名的证书：

- `api.gxkjy.com`
- `admin.gxkjy.com`
- `cert.gxkjy.com`

证书路径：

- 证书：`/etc/letsencrypt/live/api.gxkjy.com/fullchain.pem`
- 私钥：`/etc/letsencrypt/live/api.gxkjy.com/privkey.pem`

证书有效期至：`2026-10-09`

说明：

- 证书申请时短暂停止了 Nginx 容器释放 80 端口。
- MySQL、backend、admin-web、public-h5 容器未因证书申请停止。
- `certbot` 已安装自动续期任务。
- 当前未配置证书到期邮件提醒，后续可按需要补充邮箱。

## 3. Nginx 修改内容

已将 Nginx 配置调整为正式测试域名模式：

- `api.gxkjy.com`
  - HTTP 自动跳转 HTTPS。
  - HTTPS 下 `/api/` 代理到 backend。
  - `https://api.gxkjy.com/api/health` 返回 `database: ok`。

- `admin.gxkjy.com`
  - HTTP 自动跳转 HTTPS。
  - HTTPS 下根路径 `/` 访问 admin-web。
  - `/companies`、`/products`、`/settings` 等刷新不 404。

- `cert.gxkjy.com`
  - HTTP 自动跳转 HTTPS。
  - HTTPS 下 `/c/{publicToken}` 访问 public-h5。
  - 正常、作废、无效链接均可访问。

保留了 IP 临时兼容入口：

- `http://182.92.75.122/admin/`
- `http://182.92.75.122/api/health`
- `http://182.92.75.122/c/{publicToken}`

该入口只作为临时兼容和回滚对照，不作为正式入口。

## 4. .env 地址配置摘要

服务器 `.env` 中非敏感访问地址已切换为：

- `API_BASE_URL=https://api.gxkjy.com/api`
- `ADMIN_WEB_BASE_URL=https://admin.gxkjy.com`
- `CERT_PUBLIC_BASE_URL=https://cert.gxkjy.com`
- `PUBLIC_CERT_BASE_URL=https://cert.gxkjy.com`
- `VITE_API_BASE_URL=https://api.gxkjy.com/api`
- `VITE_CERT_PUBLIC_BASE_URL=https://cert.gxkjy.com`
- `VITE_APP_BASE_PATH=/`

未修改：

- MySQL 密码。
- JWT 密钥。
- OSS 占位配置。
- 后台默认账号密码。

`.env` 权限保持为 `600`。

## 5. admin-web 根路径适配

后台正式入口已切换为：

`https://admin.gxkjy.com/`

验证结果：

- `/` 返回 200。
- `/companies` 返回 200。
- `/products` 返回 200。
- `/settings` 返回 200。
- 后台登录接口通过 HTTPS 可用。

## 6. public-h5 域名适配

扫码公开页正式入口：

`https://cert.gxkjy.com/c/{publicToken}`

验证结果：

- 正常旧合格证页面返回 200。
- 作废旧合格证页面返回 200。
- 新生成合格证页面返回 200。
- 无效链接页面返回 200。
- public settings 接口读取正常。
- 公开接口未发现 `device_sn`、`manufacturer_code`、`access_secret`、`password_hash` 等敏感字段。

## 7. backend qr_url 配置

后端公开链接基础地址已由 `CERT_PUBLIC_BASE_URL` 切换为：

`https://cert.gxkjy.com`

新开合格证验证：

- 合格证编号：`GX20260711000007`
- 新生成链接：`https://cert.gxkjy.com/c/fd605e5da6013fa2821632c5d4d8f9da`
- 链接格式正确，页面可打开。

说明：

- 旧合格证数据库中仍可能保留 IP 链接。
- 本次未批量修改旧数据，避免影响已有演示数据。
- 后续新开证都会使用 HTTPS 正式测试域名。

## 8. 构建结果

本地构建：

- backend build：通过。
- admin-web build：通过，有包体积提示，不影响运行。
- public-h5 build：通过。
- miniapp build:mp-weixin：通过。

服务器构建：

- backend：已重建。
- admin-web：已重建。
- public-h5：已重建。
- nginx：已重启。

## 9. 服务器部署结果

部署前完成：

- MySQL 备份：`guxin_quick_test_20260711105432.sql.gz`
- `.env` 备份。
- `deploy/nginx/default.conf` 备份。
- `docker compose ps` 状态记录。
- `/api/health` 状态记录。

Docker 状态：

- MySQL：healthy。
- backend：running。
- admin-web：running。
- public-h5：running。
- nginx：running。

Nginx 测试：

- `nginx -t` 通过。

## 10. 全链路验证结果

DNS：

- 三个子域名均指向 `182.92.75.122`。

HTTPS：

- `https://api.gxkjy.com/api/health` 正常。
- `https://admin.gxkjy.com/` 正常。
- `https://cert.gxkjy.com/c/invalid-token` 正常。

HTTP 跳转 HTTPS：

- `http://api.gxkjy.com/api/health` 跳转到 HTTPS。
- `http://admin.gxkjy.com/` 跳转到 HTTPS。
- `http://cert.gxkjy.com/c/invalid-token` 跳转到 HTTPS。

后台：

- 后台登录接口正常。
- Dashboard、企业管理、设备管理、检测记录、合格证管理、产品库、系统设置页面刷新不 404。

客户接口：

- `demo / Demo@2026` 登录正常。
- client dashboard 正常。
- detection records 正常。
- certificates 正常。
- print-data 正常。
- 模拟打印日志写入正常。

扫码公开页：

- 正常合格证页面正常。
- 作废合格证页面正常。
- 无效链接页面正常。
- 公开设置正常。
- 敏感字段检查通过。

安全：

- `3306` 仅绑定 `127.0.0.1`。
- `3000` 仅绑定 `127.0.0.1`。
- 对外开放 `80` 和 `443`。
- `.env` 权限为 `600`。
- backend 与 Nginx 日志未见明显错误。

## 11. 微信小程序合法域名准备说明

本阶段不发布微信小程序。

后续微信小程序后台需要配置：

- request 合法域名：`https://api.gxkjy.com`

如果后续小程序内使用 web-view 打开扫码公开页，需要准备：

- web-view 业务域名：`https://cert.gxkjy.com`

说明：

- 本阶段只完成域名和 HTTPS 准备。
- 小程序体验版、正式版上传和审核由后续步骤处理。

## 12. 回滚方案

### HTTPS 配置失败时

1. 进入服务器 `/opt/gxkjy`。
2. 找到备份目录：`deploy/backups/pre_https_时间戳`。
3. 恢复 Nginx 配置：
   - 将 `default.conf.bak` 覆盖回 `deploy/nginx/default.conf`。
4. 重启 Nginx：
   - `docker compose --env-file .env -f deploy/docker-compose.yml up -d nginx`
5. 使用临时 IP 验证：
   - `http://182.92.75.122/api/health`
   - `http://182.92.75.122/admin/`
   - `http://182.92.75.122/c/invalid-token`

### admin-web 根路径异常时

1. 确认 `.env` 中 `VITE_APP_BASE_PATH=/`。
2. 如需临时回退，可恢复备份 Nginx 配置，继续使用 `http://182.92.75.122/admin/`。
3. 重新构建 admin-web 前，先确认 `VITE_API_BASE_URL` 和 `VITE_APP_BASE_PATH`。

### Nginx 配置失败时

1. 恢复 `deploy/nginx/default.conf` 备份。
2. 执行 `nginx -t`。
3. 通过后重启 Nginx 容器。

### .env 地址配置错误时

1. 恢复备份 `.env.bak`。
2. 保持权限 `600`。
3. 重建受影响的前端容器。

### 证书失败时

1. 不删除已有备份。
2. 恢复 HTTP 临时入口配置。
3. 等 DNS 和 80 端口确认后重新申请证书。

## 13. 发现并修复的问题

- 证书申请成功后，证书查看命令中的 `sed` 写法产生错误；该问题不影响证书申请结果，后续使用 `certbot certificates` 正常确认。
- 为让 Nginx 容器读取 Let’s Encrypt 证书，已在 Docker Compose 中增加 `/etc/letsencrypt:/etc/letsencrypt:ro` 只读挂载。
- 已将 admin-web 正式入口从临时 `/admin/` 模式切换到域名根路径 `/`。

## 14. 暂未处理的问题

- 未发布微信小程序。
- 未配置微信小程序后台合法域名。
- 未接入真实检测仪器。
- 未接入真实打印机。
- 未接入优博讯 K329 SDK。
- 未上传真实 OSS 密钥。
- 未批量更新旧合格证中的 IP 公开链接。

## 15. 下一步建议

进入第 17 步：微信小程序体验版准备。

建议内容：

- 在微信公众平台配置 request 合法域名。
- 按 `https://api.gxkjy.com/api` 构建小程序。
- 使用微信开发者工具导入并预览。
- 只做体验版验证，不发布正式版。
