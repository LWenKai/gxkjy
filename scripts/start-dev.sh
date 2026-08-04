#!/usr/bin/env bash
# 谷芯快检云 本地一键启动脚本
# 启动：SSH隧道(3306) + 后端(3000) + admin-web(5173) + public-h5(5174) + website(5176)
set -e

ROOT="/Users/likai/CodeBuddy/20260804211728/gxkjy"
SERVER="ubuntu@152.136.116.44"
PID_DIR="$ROOT/.runtime"
LOG_DIR="$ROOT/.runtime/logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

# 确保 pnpm 在 PATH 中
export PATH="/Users/likai/.npm-global/bin:$PATH"

# 检查是否已有实例在跑
if [ -f "$PID_DIR/tunnel.pid" ] && kill -0 "$(cat "$PID_DIR/tunnel.pid")" 2>/dev/null; then
  echo "⚠️  似乎已在运行，请先执行 ./scripts/stop-dev.sh"
  exit 1
fi

echo "==> 1/5 启动 SSH 隧道 (本地3306 -> 服务器MySQL)"
ssh -o BatchMode=yes -o ServerAliveInterval=30 -N -L 3306:127.0.0.1:3306 "$SERVER" \
  > "$LOG_DIR/tunnel.log" 2>&1 &
echo $! > "$PID_DIR/tunnel.pid"

echo "==> 2/5 启动后端 (3000)"
cd "$ROOT/backend"
export $(grep -E "^(DATABASE_URL|NODE_ENV|JWT_SECRET|JWT_EXPIRES_IN|ADMIN_INIT_USERNAME|ADMIN_INIT_PASSWORD|UPLOAD_DIR|UPLOAD_PUBLIC_BASE_URL|UPLOAD_MAX_FILE_SIZE_MB|APP_PORT|BACKEND_PORT|TZ)=" "$ROOT/.env" | xargs)
nohup pnpm exec nest start > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$PID_DIR/backend.pid"

echo "==> 3/5 启动 admin-web (5173)"
cd "$ROOT/admin-web"
nohup pnpm dev > "$LOG_DIR/admin-web.log" 2>&1 &
echo $! > "$PID_DIR/admin-web.pid"

echo "==> 4/5 启动 public-h5 (5174)"
cd "$ROOT/public-h5"
nohup pnpm dev > "$LOG_DIR/public-h5.log" 2>&1 &
echo $! > "$PID_DIR/public-h5.pid"

echo "==> 5/5 启动 website (5176)"
cd "$ROOT/website"
nohup pnpm dev > "$LOG_DIR/website.log" 2>&1 &
echo $! > "$PID_DIR/website.pid"

echo ""
echo "✅ 全部启动完成！"
echo "   管理后台:  http://localhost:5173/"
echo "   合格证页:  http://localhost:5174/"
echo "   官网:      http://localhost:5176/"
echo "   后端API:   http://localhost:3000/api"
echo ""
echo "查看日志: tail -f $LOG_DIR/<服务名>.log"
echo "停止服务: ./scripts/stop-dev.sh"
