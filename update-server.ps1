# ============================================
# TreeNB 智慧盐湖平台 - 远程更新脚本
# 用法: powershell -File update-server.ps1
# 前提: SSH 密钥已配置 (treenb_deploy)
# ============================================
param(
    [string]$Server = "140.143.246.66",
    [string]$User = "ubuntu",
    [string]$RemotePath = "/opt/saltlake",
    [string]$ProjectPath = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$KeyPath = "$env:USERPROFILE\.ssh\treenb_deploy"

Write-Host "=== TreeNB 远程更新 ===" -ForegroundColor Cyan
Write-Host "服务器: $Server"
Write-Host ""

# Step 1: Package project
Write-Host "[1/4] 打包项目文件..." -ForegroundColor Yellow
$TarFile = "$env:TEMP\treenb-update.tar.gz"

# Files to exclude
$excludeDirs = @(
    "node_modules", ".next", ".git", ".claude", ".mimocode",
    ".vercel", "tsconfig.tsbuildinfo", "*.tar.gz"
)

$excludeArgs = $excludeDirs | ForEach-Object { "--exclude=$_" }

# Use Git Bash tar
$gitBashPath = "C:\Program Files\Git\bin\bash.exe"
if (Test-Path $gitBashPath) {
    $tarCmd = "cd `"$ProjectPath`" && tar -czf `"$TarFile`" $($excludeArgs -join ' ') -C `"$ProjectPath`" ."
    & $gitBashPath -c $tarCmd
} else {
    Write-Error "Git Bash not found at $gitBashPath"
    exit 1
}

$tarSize = (Get-Item $TarFile).Length / 1KB
Write-Host "  打包完成: $([math]::Round($tarSize)) KB"

# Step 2: Upload to server
Write-Host "[2/4] 上传到服务器..." -ForegroundColor Yellow
$scpCmd = "scp -i `"$KeyPath`" -o StrictHostKeyChecking=no `"$TarFile`" ${User}@${Server}:/tmp/treenb-update.tar.gz"
iex "& $gitBashPath -c `"$scpCmd`"" 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Error "上传失败!"
    exit 1
}
Write-Host "  上传完成"

# Step 3: Extract and rebuild on server
Write-Host "[3/4] 远程更新并重建..." -ForegroundColor Yellow
$remoteCmd = @"
cd $RemotePath && \
sudo tar -xzf /tmp/treenb-update.tar.gz && \
rm /tmp/treenb-update.tar.gz && \
sudo chown -R ubuntu:ubuntu . && \
echo 'Files updated' && \
sudo docker compose -f docker-compose.prod.yml up -d --build app 2>&1
"@

$sshCmd = "ssh -i `"$KeyPath`" -o StrictHostKeyChecking=no ${User}@${Server} `"$remoteCmd`""
iex "& $gitBashPath -c `"$sshCmd`"" 2>&1

# Step 4: Verify
Write-Host ""
Write-Host "[4/4] 验证部署..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$verifyCmd = "ssh -i `"$KeyPath`" -o StrictHostKeyChecking=no ${User}@${Server} 'sudo docker ps --format `"table {{.Names}}\\t{{.Status}}\\t{{.Ports}}`" && echo `"---`" && sudo docker logs saltlake-app --tail 5'"
iex "& $gitBashPath -c `"$verifyCmd`"" 2>&1

Write-Host ""
Write-Host "=== 更新完成 ===" -ForegroundColor Green
Write-Host "访问地址: http://$Server" -ForegroundColor Green

# Cleanup
Remove-Item $TarFile -Force -ErrorAction SilentlyContinue
