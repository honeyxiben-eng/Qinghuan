<#
.SYNOPSIS
    TreeNB 一键部署脚本 - 腾讯云服务器
.DESCRIPTION
    自动完成全部部署流程：清理服务器、克隆代码、构建Docker、配置SSL
.PARAMETER Server
    服务器IP地址 (默认 140.143.246.66)
.PARAMETER User
    SSH用户名 (默认 ubuntu)
.PARAMETER Domain
    域名 (默认 moodos.cn)
.PARAMETER SkipSSL
    跳过SSL证书配置
.EXAMPLE
    .\deploy-full.ps1
    .\deploy-full.ps1 -SkipSSL
#>
param(
    [string]$Server = "140.143.246.66",
    [string]$User = "ubuntu",
    [string]$Domain = "moodos.cn",
    [string]$ProjectDir = "C:\Users\Schem\Desktop\TreeNB",
    [string]$RemoteDir = "/opt/saltlake",
    [string]$GithubRepo = "https://github.com/honeyxiben-eng/Qinghuan.git",
    [switch]$SkipSSL
)

$ErrorActionPreference = "Stop"
$GitBash = "C:\Program Files\Git\bin\bash.exe"
$sshBase = "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10"

# ============================================
# 0. 检查前置条件
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TreeNB 一键部署工具" -ForegroundColor Cyan
Write-Host "  目标: $Server | 域名: $Domain" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $GitBash)) {
    Write-Error "Git Bash 未找到: $GitBash"
    Write-Host "请安装 Git for Windows: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check SSH key
$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_tcloud"
if (-not (Test-Path $sshKey)) {
    Write-Host "[0/5] 生成 SSH 密钥..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force | Out-Null
    & $GitBash -c "ssh-keygen -t ed25519 -f `"$sshKey`" -N '' -C 'treenb-deploy'" 2>&1
    Write-Host ""
    Write-Host "=== 请将以下公钥添加到腾讯云服务器 ===" -ForegroundColor Green
    Write-Host "  方式1: 腾讯云控制台 -> 轻量应用服务器 -> 密钥管理 -> 导入密钥" -ForegroundColor White
    Write-Host "  方式2: 使用腾讯云 Web SSH 登录后执行:" -ForegroundColor White
    Write-Host "    echo '$(Get-Content "$sshKey.pub")' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
    $confirm = Read-Host "公钥已添加？按 Enter 继续 (或 Ctrl+C 取消)"
}

Write-Host ""

# ============================================
# 1. 清理服务器
# ============================================
Write-Host "[1/5] 清理服务器..." -ForegroundColor Yellow

$cleanCmd = @"
echo '=== 停止所有容器 ===' && \
sudo docker stop saltlake-app saltlake-nginx 2>/dev/null; \
sudo docker rm saltlake-app saltlake-nginx 2>/dev/null; \
echo '=== 清理旧文件 ===' && \
sudo rm -rf $RemoteDir && \
echo '=== 清理Docker资源 ===' && \
sudo docker system prune -af --volumes 2>/dev/null; \
echo '=== 服务器已清空 ==='
"@

$sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$cleanCmd`""
iex "& $GitBash -c `"$sshCmd`"" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "清理步骤有警告（可能服务器是全新的），继续..."
}
Write-Host "  服务器已清空" -ForegroundColor Green

# ============================================
# 2. 安装 Docker（如未安装）
# ============================================
Write-Host "[2/5] 检查/安装 Docker..." -ForegroundColor Yellow

$dockerCheck = @"
if command -v docker &> /dev/null; then
    echo 'Docker already installed'
    docker --version
    docker compose version
else
    echo 'Installing Docker...'
    curl -fsSL https://get.docker.com | sudo bash
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $User
    docker --version
fi
"@

$sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$dockerCheck`""
iex "& $GitBash -c `"$sshCmd`"" 2>&1
Write-Host "  Docker 已就绪" -ForegroundColor Green

# ============================================
# 3. 克隆代码 & 配置环境
# ============================================
Write-Host "[3/5] 部署代码..." -ForegroundColor Yellow

$setupCmd = @"
echo '=== 克隆代码 ===' && \
cd /opt && \
git clone $GithubRepo saltlake && \
cd $RemoteDir && \
echo '=== 创建 .env ===' && \
cp .env.production .env && \
echo '=== 创建 SSL 目录 ===' && \
mkdir -p ssl && \
echo '=== 配置完成 ==='
"@

$sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$setupCmd`""
iex "& $GitBash -c `"$sshCmd`"" 2>&1
Write-Host "  代码已部署" -ForegroundColor Green

# ============================================
# 4. 构建 & 启动
# ============================================
Write-Host "[4/5] 构建并启动 Docker 服务 (需要几分钟)..." -ForegroundColor Yellow

$buildCmd = @"
cd $RemoteDir && \
echo '=== 拉取基础镜像 ===' && \
sudo docker pull nginx:alpine && \
sudo docker pull node:20-alpine && \
echo '=== 构建应用 ===' && \
sudo docker compose -f docker-compose.prod.yml build app && \
echo '=== 启动服务 ===' && \
sudo docker compose -f docker-compose.prod.yml up -d && \
echo '=== 等待启动 ===' && \
sleep 10 && \
echo '=== 状态检查 ===' && \
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' && \
echo '---' && \
sudo docker logs saltlake-app --tail 5 2>&1
"@

$sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$buildCmd`""
iex "& $GitBash -c `"$sshCmd`"" 2>&1
Write-Host "  服务已启动" -ForegroundColor Green

# ============================================
# 5. SSL 配置（可选）
# ============================================
if (-not $SkipSSL) {
    Write-Host "[5/5] 配置 SSL 证书..." -ForegroundColor Yellow

    $sslCmd = @"
echo '=== 安装 certbot ===' && \
sudo apt-get update -qq && \
sudo apt-get install -y -qq certbot && \
echo '=== 获取证书 ===' && \
sudo certbot certonly --webroot \
    -w /var/lib/docker/volumes/saltlake_certbot-webroot/_data \
    -d $Domain \
    -d www.$Domain \
    --non-interactive --agree-tos \
    --email admin@$Domain \
    --keep-until-expiring --expand && \
echo '=== 复制证书 ===' && \
sudo cp /etc/letsencrypt/live/$Domain/fullchain.pem $RemoteDir/ssl/ && \
sudo cp /etc/letsencrypt/live/$Domain/privkey.pem $RemoteDir/ssl/ && \
sudo chmod 644 $RemoteDir/ssl/*.pem && \
echo '=== 证书已就绪 ==='
"@

    $sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$sslCmd`""
    iex "& $GitBash -c `"$sshCmd`"" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SSL 证书已获取！" -ForegroundColor Green
        Write-Host ""
        Write-Host "【重要】现在需要启用 HTTPS：" -ForegroundColor Yellow
        Write-Host "  编辑服务器上的 nginx.conf，取消 HTTPS 部分的注释：" -ForegroundColor White
        Write-Host "  ssh -i `"$sshKey`" $User@$Server" -ForegroundColor Gray
        Write-Host "  sudo nano $RemoteDir/nginx.conf" -ForegroundColor Gray
        Write-Host "  然后重启 nginx:" -ForegroundColor Gray
        Write-Host "  sudo docker compose -f $RemoteDir/docker-compose.prod.yml restart nginx" -ForegroundColor Gray
    } else {
        Write-Warning "SSL 获取失败。你可以稍后手动运行: sudo certbot certonly --webroot -w /var/lib/docker/volumes/saltlake_certbot-webroot/_data -d $Domain"
    }
}

# ============================================
# 完成
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  访问地址: http://$Domain" -ForegroundColor White
Write-Host "  (SSL 配置后: https://$Domain)" -ForegroundColor Gray
Write-Host ""
Write-Host "  后续更新代码:" -ForegroundColor Yellow
Write-Host "  1. 本地 git push" -ForegroundColor White
Write-Host "  2. SSH 到服务器执行:" -ForegroundColor White
Write-Host "     cd $RemoteDir && sudo bash deploy.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "  查看日志:" -ForegroundColor Yellow
Write-Host "     ssh -i `"$sshKey`" $User@$Server 'sudo docker logs -f saltlake-app'" -ForegroundColor Gray
Write-Host ""
