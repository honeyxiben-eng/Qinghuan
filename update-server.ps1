# ============================================
# TreeNB - 快速远程更新
# 用法: .\update-server.ps1
# 前提: 本地代码已 git push
# ============================================
param(
    [string]$Server = "140.143.246.66",
    [string]$User = "ubuntu",
    [string]$RemotePath = "/opt/saltlake"
)

$ErrorActionPreference = "Stop"
$GitBash = "C:\Program Files\Git\bin\bash.exe"
$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_tcloud"

Write-Host "=== TreeNB 远程更新 ===" -ForegroundColor Cyan
Write-Host "服务器: $Server" -ForegroundColor White
Write-Host ""

$remoteCmd = @"
cd $RemotePath && \
echo '[1/3] 拉取最新代码...' && \
git pull origin master && \
echo '[2/3] 重新构建并重启...' && \
sudo docker compose -f docker-compose.prod.yml up -d --build app 2>&1 && \
echo '[3/3] 清理旧镜像...' && \
sudo docker image prune -f && \
echo '' && \
echo '=== 当前状态 ===' && \
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"@

$sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$remoteCmd`""
iex "& $GitBash -c `"$sshCmd`"" 2>&1

Write-Host ""
Write-Host "=== 更新完成 ===" -ForegroundColor Green
Write-Host "访问: https://moodos.cn" -ForegroundColor Green