#!/bin/bash
# ============================================
# TreeNB - 快速更新脚本 (服务器端运行)
# 用法: sudo bash deploy.sh
# 效果: git pull + 重新构建 + 重启, 30秒完成
# ============================================
set -e

cd /opt/saltlake
echo "=== TreeNB 更新 $(date '+%Y-%m-%d %H:%M:%S') ==="

echo "[1/4] 拉取最新代码..."
git pull origin master

echo "[2/4] 重新构建 (仅 app 容器)..."
sudo docker compose -f docker-compose.prod.yml build app --no-cache

echo "[3/4] 重启应用..."
sudo docker compose -f docker-compose.prod.yml up -d app

echo "[4/4] 清理旧镜像..."
sudo docker image prune -f

echo ""
echo "=== 更新完成 ==="
echo ""
sudo docker compose -f docker-compose.prod.yml ps
echo ""
echo "查看日志: sudo docker compose -f docker-compose.prod.yml logs -f app"
echo "备份数据库: cp prisma/saltlake.db ~/backup/saltlake-$(date +%Y%m%d).db"