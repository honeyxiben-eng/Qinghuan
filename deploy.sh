#!/bin/bash
# ============================================
# 智慧盐湖平台 - 部署/更新脚本
# 在服务器上运行: bash deploy.sh
# ============================================
set -e

echo "=== 智慧盐湖平台 部署更新 ==="

# 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull origin master

# 构建并重启
echo "[2/5] 重新构建 Docker 镜像..."
docker compose -f docker-compose.prod.yml build app

echo "[3/5] 重启服务..."
docker compose -f docker-compose.prod.yml up -d app

echo "[4/5] 清理旧镜像..."
docker image prune -f

echo "[5/5] 检查服务状态..."
sleep 3
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=20 app

echo ""
echo "=== 部署完成 ==="
echo "查看日志: docker compose -f docker-compose.prod.yml logs -f app"
echo "重启 Nginx: docker compose -f docker-compose.prod.yml restart nginx"
