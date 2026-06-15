#!/bin/bash
# ============================================
# TreeNB - 部署/更新脚本 (服务器端运行)
# 用法: bash deploy.sh
# ============================================
set -e

echo "=== TreeNB 部署更新 ==="
echo "[1/3] 重新构建..."
cd /opt/saltlake
sudo docker compose -f docker-compose.prod.yml build app

echo "[2/3] 重启服务..."
sudo docker compose -f docker-compose.prod.yml up -d app

echo "[3/3] 清理旧镜像..."
sudo docker image prune -f

echo ""
echo "=== 完成 ==="
sudo docker compose -f docker-compose.prod.yml ps
echo ""
echo "查看日志: sudo docker compose -f docker-compose.prod.yml logs -f app"
