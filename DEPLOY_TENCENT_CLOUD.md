# 智慧盐湖平台 — 腾讯云部署指南

## 为什么选腾讯云

| 对比 | Vercel | 腾讯云 |
|------|--------|--------|
| 稳定性 | Serverless 冷启动、超时 30s | 常驻进程，永远在线 |
| 延迟（国内） | 日本节点 ~80ms | <20ms |
| 数据库 | 依赖远程 Turso | 本地 SQLite，零延迟 |
| 费用 | 免费层限制多 | ~50 元/月（2核2G） |
| 文件上传 | 10MB 限制 | 无限制 |

---

## 第一步：购买服务器

打开 [腾讯云轻量应用服务器](https://cloud.tencent.com/product/lighthouse)

推荐配置：
- **2核2GB** — 68 元/月（够用）
- 系统选 **Ubuntu 22.04 LTS**
- 地域选离你最近的（北京/上海/广州）
- 流量包 300GB/月绰绰有余

> 新用户常有三折券，折后 ~200 元/年

---

## 第二步：连接服务器

购买完成后在控制台找到 **公网 IP**（如 `123.456.78.90`）。

在本地终端 SSH 登录：
```bash
ssh root@你的服务器IP
# 输入控制台设置的管理员密码
```

---

## 第三步：安装 Docker

在服务器上一键安装：

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 启动 Docker
systemctl enable docker && systemctl start docker

# 验证
docker --version
```

---

## 第四步：部署项目

```bash
# 克隆代码
cd /opt
git clone https://github.com/honeyxiben-eng/Qinghuan.git saltlake
cd saltlake

# ⚠️ 重要：上传数据库文件（从你本地电脑执行，不是在服务器上）
# 在本地电脑打开新终端，运行：
# scp C:\Users\Schem\Desktop\TreeNB\prisma\saltlake.db root@你的IP:/opt/saltlake/prisma/

# 创建环境变量文件
cp .env.production .env
nano .env   # 修改 JWT_SECRET 为随机字符串

# 构建并启动
docker compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
```

看到 `Ready in ...ms` 就说明启动成功了！

---

## 第五步：配置防火墙

腾讯云控制台 → 轻量应用服务器 → 你的服务器 → 防火墙 → 添加规则：

| 端口 | 协议 | 说明 |
|------|------|------|
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 22 | TCP | SSH（默认已有） |

---

## 第六步：域名 & SSL（可选但推荐）

### 配置域名
在你的域名管理后台（阿里云/腾讯云 DNS）添加 A 记录：
```
类型: A
主机记录: @（或 www）
记录值: 你的服务器 IP
```

### 获取免费 SSL 证书

```bash
# SSH 到服务器
apt install -y certbot

# 先停掉 nginx（因为 certbot 需要 80 端口）
docker compose -f docker-compose.prod.yml stop nginx

# 获取证书（替换为你的域名）
certbot certonly --standalone -d 你的域名.com

# 证书位置
# /etc/letsencrypt/live/你的域名.com/fullchain.pem
# /etc/letsencrypt/live/你的域名.com/privkey.pem

# 复制到项目目录
cp /etc/letsencrypt/live/你的域名.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/你的域名.com/privkey.pem ./ssl/

# 编辑 nginx.conf，取消 HTTPS 部分的注释
# 然后重启
docker compose -f docker-compose.prod.yml up -d nginx
```

---

## 日常更新

以后代码有改动，只需要：

```bash
cd /opt/saltlake
bash deploy.sh
```

30 秒完成更新，零停机。

---

## 常用命令

```bash
# 查看运行状态
docker compose -f docker-compose.prod.yml ps

# 查看应用日志
docker compose -f docker-compose.prod.yml logs -f app

# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 备份数据库
cp prisma/saltlake.db ~/backup/saltlake-$(date +%Y%m%d).db

# 设置每日自动备份（可选）
crontab -e
# 添加: 0 3 * * * cp /opt/saltlake/prisma/saltlake.db ~/backup/saltlake-$(date +\%Y\%m\%d).db
```

---

## 费用预估

| 项目 | 月费 |
|------|------|
| 轻量应用服务器 2核2G | ¥68 |
| 域名 moodos.cn | ~¥5 |
| SSL 证书 | 免费 (Let's Encrypt) |
| **合计** | **~¥73/月** |

> 比 Vercel Pro ($20/月) 便宜，且国内访问更快更稳定。

---

## 架构图

```
用户浏览器 (https://moodos.cn)
        │
        ▼
  [Nginx :80/:443]
  反向代理 + SSL
        │
        ▼
  [Next.js :3456]        ← Docker 容器
  常驻进程，零冷启动      (saltlake-app)
        │
        ▼
  [SQLite 文件]           ← Docker Volume 持久化
  prisma/saltlake.db
```
