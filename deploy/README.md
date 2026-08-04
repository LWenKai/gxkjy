# 谷芯快检云部署说明

这份文档是 `deploy/` 目录的上线和维护入口。它面向项目负责人、部署人员和后续维护人员，目标是把“能启动”推进到“可检查、可排障、可备份、可交接”。

> 执行位置：以下命令默认在项目根目录 `D:\gxkjy` 或服务器项目根目录执行。  
> 配置原则：不要把真实密码、Token、证书私钥写入仓库；敏感值只放在服务器 `.env`、证书目录或运维密钥库里。

## 快速导航

- [1. 上线前必查](#1-上线前必查)
- [2. 服务拓扑](#2-服务拓扑)
- [3. 域名和路由](#3-域名和路由)
- [4. 环境变量](#4-环境变量)
- [5. 首次上线步骤](#5-首次上线步骤)
- [6. Nginx 配置检查](#6-nginx-配置检查)
- [7. 上线验收清单](#7-上线验收清单)
- [8. 运行状态判断](#8-运行状态判断)
- [9. 数据库备份](#9-数据库备份)
- [10. 常见风险和处理](#10-常见风险和处理)
- [11. 文档和配置改动原则](#11-文档和配置改动原则)
- [12. 交付文档标准](#12-交付文档标准)

## 1. 上线前必查

上线前先过这一组清单，再执行构建命令。

- [ ] 服务器已安装 Docker 和 Docker Compose，并且 80、443 端口可被公网访问。
- [ ] 项目根目录存在 `.env`，并已填写数据库、后端、上传目录、前端 API 地址等变量。
- [ ] DNS 已指向服务器：`api.gxkjy.com`、`admin.gxkjy.com`、`cert.gxkjy.com`、`gxkjy.com`、`www.gxkjy.com`。
- [ ] `/etc/letsencrypt/live/api.gxkjy.com/` 下已有可用证书，且证书覆盖 `api`、`admin`、`cert` 三个域名。
- [ ] `UPLOAD_DIR` 对应的宿主机目录已创建，并允许后端容器写入、Nginx 容器只读访问。
- [ ] 已确认官网 `gxkjy.com` 是否需要强制 HTTPS。当前 `nginx/default.conf` 中官网 HTTP 直接代理到官网容器，没有强制跳转。
- [ ] 已确认备份保存位置和保留天数。当前备份脚本是手动或外部定时触发，不自带定时任务。

推荐先在服务器上准备上传目录：

```bash
mkdir -p /opt/gxkjy/uploads
```

## 2. 服务拓扑

| 服务 | Compose 服务名 | 容器名 | 对外入口 | 作用 |
| --- | --- | --- | --- | --- |
| MySQL | `mysql` | `guxin-mysql` | 默认仅本机 `127.0.0.1:3306` | 业务数据库 |
| 后端 API | `backend` | `guxin-backend` | 经 Nginx 暴露 `/api/` | 登录、证书、检测记录、文件上传等接口 |
| 管理后台 | `admin-web` | `guxin-admin-web` | `https://admin.gxkjy.com` | 管理端页面 |
| 公开证书 H5 | `public-h5` | `guxin-public-h5` | `https://cert.gxkjy.com` | 扫码查看证书 |
| 官网 | `website` | `guxin-website` | `http://gxkjy.com` / `http://www.gxkjy.com` | 官网展示 |
| 反向代理 | `nginx` | `guxin-nginx` | 80 / 443 | 域名路由、HTTPS、静态上传文件访问 |
| 数据库备份 | `mysql-backup` | 一次性任务 | 手动或定时触发 | 导出 `.sql.gz` 备份 |

## 3. 域名和路由

| 域名 | 当前行为 | 备注 |
| --- | --- | --- |
| `api.gxkjy.com` | 80 跳转 HTTPS，443 代理后端 `/api/` | `/uploads/` 由 Nginx 从宿主机上传目录只读提供 |
| `admin.gxkjy.com` | 80 跳转 HTTPS，443 代理管理后台 | 还包含官网预览相关路径代理 |
| `cert.gxkjy.com` | 80 跳转 HTTPS，443 代理公开 H5 | 用于证书扫码公开页 |
| `gxkjy.com` / `www.gxkjy.com` | 80 直接代理官网容器 | 是否改为 HTTPS 跳转，需要上线前确认 |
| 未匹配域名 | 80 默认入口，`/api/` 到后端，`/admin/` 到后台，`/c/` 到公开 H5 | 适合临时调试，不建议作为正式入口宣传 |

当前 443 配置复用 `/etc/letsencrypt/live/api.gxkjy.com/` 证书目录。正式上线前要确认证书 SAN 覆盖所有 HTTPS 域名，否则浏览器会报证书不匹配。

## 4. 环境变量

`.env` 放在项目根目录，不放在 `deploy/` 目录。至少确认这些变量：

| 变量 | 用途 | 建议 |
| --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | 只在服务器保存，使用高强度随机值 |
| `MYSQL_DATABASE` | 业务数据库名 | 与 `DATABASE_URL_DOCKER` 保持一致 |
| `MYSQL_USER` | 应用数据库用户 | 不要使用 root 作为应用用户 |
| `MYSQL_PASSWORD` | 应用数据库密码 | 与 `DATABASE_URL_DOCKER` 保持一致 |
| `DATABASE_URL_DOCKER` | 后端容器连接数据库 | 主机名应使用 compose 服务名 `mysql` |
| `VITE_API_BASE_URL` | 前端调用 API 的基础地址 | 生产环境建议为 `https://api.gxkjy.com/api` |
| `VITE_CERT_PUBLIC_BASE_URL` | 证书公开页基础地址 | 生产环境建议为 `https://cert.gxkjy.com` |
| `UPLOAD_DIR` | 宿主机上传目录 | 建议 `/opt/gxkjy/uploads`，需要持久化和备份策略 |
| `TZ` | 容器时区 | 建议 `Asia/Shanghai` |

可选变量：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `MYSQL_PORT` | `3306` | MySQL 本机映射端口 |
| `APP_PORT` | `3000` | 后端本机映射端口 |
| `BACKEND_PORT` | `3000` | 后端容器内端口 |
| `NODE_ENV` | `production` | 后端运行环境 |
| `BACKUP_RETENTION_DAYS` | `14` | 本地备份保留天数 |

## 5. 首次上线步骤

先确认 `.env` 已就绪，再启动全套服务：

```bash
docker compose -f deploy/docker-compose.yml --env-file .env up -d --build
```

查看服务状态：

```bash
docker compose -f deploy/docker-compose.yml --env-file .env ps
```

查看关键日志：

```bash
docker compose -f deploy/docker-compose.yml --env-file .env logs -f backend
docker compose -f deploy/docker-compose.yml --env-file .env logs -f nginx
```

如果只改了前端或后端代码，可以单独重建对应服务：

```bash
docker compose -f deploy/docker-compose.yml --env-file .env up -d --build backend
docker compose -f deploy/docker-compose.yml --env-file .env up -d --build admin-web
docker compose -f deploy/docker-compose.yml --env-file .env up -d --build public-h5
docker compose -f deploy/docker-compose.yml --env-file .env up -d --build website
```

## 6. Nginx 配置检查

修改 `deploy/nginx/default.conf` 后，先检查配置再重启：

```bash
docker compose -f deploy/docker-compose.yml --env-file .env exec nginx nginx -t
docker compose -f deploy/docker-compose.yml --env-file .env restart nginx
```

常见检查点：

- 域名是否写在正确的 `server_name`。
- 证书路径是否真实存在，并覆盖对应域名。
- `/api/`、`/uploads/`、`/admin/`、`/c/` 等路径是否与前端配置一致。
- 上传文件访问是否只读代理，不允许通过 Nginx 写入。

## 7. 上线验收清单

上线后按顺序验证，避免只看首页可访问就结束。

- [ ] `docker compose ... ps` 中 `mysql`、`backend`、`admin-web`、`public-h5`、`website`、`nginx` 均为运行状态。
- [ ] `https://api.gxkjy.com/api` 能返回预期接口响应或明确的接口错误，不应是 Nginx 502。
- [ ] `https://admin.gxkjy.com` 能打开管理后台，登录流程可用。
- [ ] `https://cert.gxkjy.com` 能打开公开 H5，证书公开页路径可访问。
- [ ] `http://gxkjy.com` 和 `http://www.gxkjy.com` 能打开官网；如果决定强制 HTTPS，应同步调整 Nginx 配置并复测。
- [ ] 后台上传文件后，公开访问路径能正常读取文件。
- [ ] 后端日志没有连续数据库连接失败、上传目录权限失败、证书路径错误等问题。
- [ ] 执行一次数据库备份，确认生成的 `.sql.gz` 文件可被复制到服务器外部位置。

## 8. 运行状态判断

部署排障时不要只看“页面打不开”。先判断当前属于哪一种状态，再决定看哪类日志。

| 状态 | 典型表现 | 优先检查 |
| --- | --- | --- |
| 空状态 | 页面能打开，但列表、证书或后台数据为空 | 确认数据库是否已初始化、账号是否有数据权限、前端 API 地址是否指向生产接口 |
| 加载中 | 页面长时间转圈，接口请求没有完成 | 看浏览器请求、`backend` 日志、数据库连接状态，以及 Nginx 是否把 `/api/` 正确代理到后端 |
| 错误态 | 页面 404、接口 500、Nginx 502/504、证书错误 | 先区分前端路由、后端异常、Nginx 代理和 HTTPS 证书四类问题 |
| 权限态 | 登录失败、上传失败、公开文件 403 | 检查账号权限、上传目录权限、`UPLOAD_DIR` 挂载和 Nginx 只读访问路径 |
| 备份态 | 备份命令执行完但没有文件，或文件大小异常 | 看 `mysql-backup` 输出、数据库变量、备份目录挂载和磁盘空间 |

建议保留一次上线验收截图或日志摘要，后续排障时可以对照“当时正常状态”快速缩小范围。

## 9. 数据库备份

手动执行一次备份：

```bash
docker compose -f deploy/docker-compose.yml --env-file .env --profile backup run --rm mysql-backup
```

备份文件默认写入 `deploy/backup/`，文件名形如：

```text
<数据库名>_YYYYmmdd_HHMMSS.sql.gz
```

维护纪律：

- 本地备份只解决“短期误操作恢复”，不能替代异地备份。
- 建议把备份同步到服务器外部位置，例如对象存储、另一台服务器或离线存储。
- 恢复前先停止可能写库的业务操作，并保留当前数据库快照。
- 恢复命令不要写成日常快捷命令，避免误执行覆盖生产数据。

## 10. 常见风险和处理

| 风险 | 表现 | 处理 |
| --- | --- | --- |
| 证书覆盖不足 | 浏览器提示证书不匹配，或 Nginx 443 启动失败 | 重新签发包含 `api`、`admin`、`cert` 的证书，或拆分证书路径 |
| 上传目录权限不对 | 后端上传失败，或公开文件 403/404 | 检查 `UPLOAD_DIR`、宿主机目录权限、Nginx 只读挂载路径 |
| 官网未强制 HTTPS | `gxkjy.com` 仍可通过 HTTP 访问 | 确认业务决策后，把官网 80 配置改为 301 到 HTTPS |
| 备份未定时 | 只有手动备份，长期容易遗漏 | 在服务器 crontab 或运维平台中定时调用备份命令 |
| `.env` 与前端地址不一致 | 前端请求错误域名或混用 HTTP/HTTPS | 统一 `VITE_API_BASE_URL` 和 `VITE_CERT_PUBLIC_BASE_URL` 后重新构建前端服务 |
| Nginx 默认入口被误当正式入口 | 通过服务器 IP 或未知域名访问到临时路由 | 正式宣传只使用绑定域名；必要时把默认入口改为 404 |

## 11. 文档和配置改动原则

- 先改 `.env` 和配置，再重建相关服务，不要在运行容器里手工改文件。
- 改 Nginx 前先明确域名、证书、路径三件事，避免多个问题叠在一起排查。
- 改前端公开地址后必须重新构建对应前端容器。
- 涉及数据库、上传目录、证书的改动，先备份再操作。
- 交接时以本 README、`docker-compose.yml`、`nginx/default.conf`、`.env` 示例说明为准，不靠口头记忆。

## 12. 交付文档标准

这份 README 的“好设计”不是装饰，而是降低上线和维护成本：

- 信息层级：先必查，再拓扑，再命令，再验收和风险。
- 表达风格：务实、明确、可执行，不夸大系统能力。
- 信息密度：每一节只解决一个运维问题，避免把解释和命令混在一起。
- 安全边界：只写变量名和路径，不写真实密钥、证书私钥、生产密码。
- 模板感禁区：不使用空泛口号，不写无来源指标，不把部署风险藏在长段落里。
