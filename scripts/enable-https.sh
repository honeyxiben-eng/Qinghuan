#!/bin/bash
# ============================================
# TreeNB - 启用 HTTPS (服务器端运行)
# 前提: SSL 证书已通过 certbot 获取
# 用法: sudo bash enable-https.sh
# ============================================
set -e

cd /opt/saltlake

echo "=== 启用 HTTPS for moodos.cn ==="

# Check certs exist
if [ ! -f /etc/letsencrypt/live/moodos.cn/fullchain.pem ]; then
    echo "证书不存在，请先运行 certbot:"
    echo "  sudo certbot certonly --webroot -w /var/lib/docker/volumes/saltlake_certbot-webroot/_data -d moodos.cn -d www.moodos.cn"
    exit 1
fi

echo "[1/3] 复制证书..."
sudo cp /etc/letsencrypt/live/moodos.cn/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/moodos.cn/privkey.pem ./ssl/
sudo chmod 644 ./ssl/*.pem

echo "[2/3] 备份并更新 nginx.conf..."
cp nginx.conf nginx.conf.bak

# Create HTTPS-enabled nginx config
cat > nginx.conf << 'NGINXEOF'
# TreeNB - Nginx reverse proxy for moodos.cn (HTTPS enabled)

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name moodos.cn www.moodos.cn;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name moodos.cn www.moodos.cn;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    client_max_body_size 20m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://app:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
NGINXEOF

echo "[3/3] 重启 nginx..."
sudo docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "=== HTTPS 已启用 ==="
echo "访问: https://moodos.cn"
echo ""
echo "设置自动续期 (可选):"
echo "  echo '0 3 * * * root certbot renew --quiet --deploy-hook \"cp /etc/letsencrypt/live/moodos.cn/fullchain.pem /opt/saltlake/ssl/ && cp /etc/letsencrypt/live/moodos.cn/privkey.pem /opt/saltlake/ssl/ && docker restart saltlake-nginx\"' | sudo tee /etc/cron.d/certbot-renew"