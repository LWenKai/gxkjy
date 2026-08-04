#!/usr/bin/env bash
# 谷芯快检云 本地一键停止脚本
ROOT="/Users/likai/CodeBuddy/20260804211728/gxkjy"
PID_DIR="$ROOT/.runtime"

stop() {
  local name="$1"
  local pidfile="$PID_DIR/$name.pid"
  if [ -f "$pidfile" ]; then
    local pid="$(cat "$pidfile")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "停止 $name (PID $pid)"
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  fi
}

stop tunnel
stop backend
stop admin-web
stop public-h5
stop website

# 兜底：清理可能残留的 vite/nest 进程
pkill -f "vite.*51(73|74|76)" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
pkill -f "ssh -o BatchMode.*3306" 2>/dev/null || true

echo "✅ 已停止所有本地开发服务"
