#!/bin/bash
# ============================================
# TreeNB - 快速更新脚本 (服务器端运行)
# 用法: cd /opt/saltlake && sudo bash deploy.sh
# ============================================
set -e

cd /opt/saltlake
LOGFILE=/opt/saltlake/deploy.log
exec > >(tee -a $LOGFILE) 2>&1

echo "=== TreeNB 更新 $(date '+%Y-%m-%d %H:%M:%S') ==="

# 1. 备份数据库
echo '[1/4] 备份数据库...'
mkdir -p /opt/backups
sudo cp /var/lib/docker/volumes/saltlake_saltlake-data/_data/saltlake.db /opt/backups/saltlake-$(date +%Y%m%d-%H%M%S).db
echo '  完成'

# 2. 拉取代码
echo '[2/4] 拉取最新代码...'
git pull origin master

# 3. 重建并重启 (使用缓存，速度快)
echo '[3/4] 重建并重启...'
sudo docker compose -f docker-compose.prod.yml up -d --build app
sleep 5

# 4. 清理
echo '[4/4] 清理旧镜像...'
sudo docker image prune -f

echo ''
echo '=== 更新完成 ==='
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
echo ''
echo '日志: sudo docker compose -f /opt/saltlake/docker-compose.prod.yml logs -f app'
