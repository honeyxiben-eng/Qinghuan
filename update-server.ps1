# ============================================
# TreeNB - 快速远程更新 (一键推送+部署)
# 用法: .\update-server.ps1
# 前提: 本地代码已 commit
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

# Step 1: Push local changes
Write-Host "[1/2] 推送本地代码..." -ForegroundColor Yellow
& $GitBash -c "cd `"$PWD`" && git push origin master" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "推送失败，请先 commit 本地更改"
    exit 1
}
Write-Host "  推送成功" -ForegroundColor Green

# Step 2: Remote update
Write-Host "[2/2] 远程更新服务器..." -ForegroundColor Yellow

$remoteCmd = @"
cd $RemotePath && \
echo '[Update] Pull code...' && \
git pull origin master && \
echo '[Update] Backup DB...' && \
mkdir -p /opt/backups && \
sudo cp /var/lib/docker/volumes/saltlake_saltlake-data/_data/saltlake.db /opt/backups/saltlake-\$(date +%Y%m%d-%H%M%S).db && \
echo '[Update] Rebuild...' && \
sudo docker compose -f docker-compose.prod.yml build app --no-cache 2>&1 && \
echo '[Update] Restart...' && \
sudo docker compose -f docker-compose.prod.yml up -d app 2>&1 && \
sleep 3 && \
echo '[Update] Clean...' && \
sudo docker image prune -f && \
echo '' && \
echo '=== Status ===' && \
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
"@

$sshCmd = "ssh -i `"$sshKey`" -o StrictHostKeyChecking=no ${User}@${Server} `"$remoteCmd`""
iex "& $GitBash -c `"$sshCmd`"" 2>&1

Write-Host ""
Write-Host "=== 更新完成 ===" -ForegroundColor Green
Write-Host "访问: https://moodos.cn" -ForegroundColor Green
Write-Host "查看日志: ssh -i `"$sshKey`" $User@$Server 'sudo docker logs -f saltlake-app'" -ForegroundColor Gray
