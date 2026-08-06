#!/bin/bash
# 本地管理后台依赖 SSH 隧道连接服务器 MySQL(3306)
# 隧道易因网络波动断开导致登录报"服务暂时异常"
# 用法: bash gxkjy/start-tunnel.sh

# 关闭旧隧道（按端口匹配）
pkill -f '127.0.0.1:3306' 2>/dev/null
sleep 1

# 重建隧道，ServerAlive 参数让断线时自动重连
ssh -N -L 3306:127.0.0.1:3306 ubuntu@152.136.116.44 \
  -o StrictHostKeyChecking=no \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -f

echo "tunnel ready"
curl -s http://localhost:3000/api/health; echo
