# ============================================
# PostgreSQL 初始化脚本 (需管理员权限运行)
# 右键 → 以管理员身份运行 PowerShell
# 然后在提示符输入: .\scripts\setup-pg.ps1
# ============================================
Write-Host "🔧 智慧盐湖 · PostgreSQL 初始化" -ForegroundColor Cyan

$PGDATA = "C:\Program Files\PostgreSQL\16\data"
$PGBIN = "C:\Program Files\PostgreSQL\16\bin"
$env:Path = "$PGBIN;$env:Path"
$NEWPASS = "saltlake_dev_2026"

# 1. Stop service
Write-Host "`n[1/4] 停止 PostgreSQL 服务..." -ForegroundColor Yellow
Stop-Service postgresql-x64-16 -Force
Write-Host "   ✅ 已停止"

# 2. Backup + modify pg_hba.conf to trust
Write-Host "`n[2/4] 临时改为 trust 认证..." -ForegroundColor Yellow
Copy-Item "$PGDATA\pg_hba.conf" "$PGDATA\pg_hba.conf.bak" -Force
(Get-Content "$PGDATA\pg_hba.conf") -replace 'scram-sha-256', 'trust' | Set-Content "$PGDATA\pg_hba.conf"
Write-Host "   ✅ 已修改"

# 3. Start service + reset password
Write-Host "`n[3/4] 重启服务并设置密码..." -ForegroundColor Yellow
Start-Service postgresql-x64-16
Start-Sleep -Seconds 3

& "$PGBIN\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '$NEWPASS';" 2>&1 | Out-Null
& "$PGBIN\psql.exe" -U postgres -c "CREATE DATABASE saltlake;" 2>&1 | Out-Null
Write-Host "   ✅ 密码已设置: $NEWPASS"

# 4. Restore pg_hba.conf
Write-Host "`n[4/4] 恢复安全配置..." -ForegroundColor Yellow
Copy-Item "$PGDATA\pg_hba.conf.bak" "$PGDATA\pg_hba.conf" -Force
Restart-Service postgresql-x64-16
Start-Sleep -Seconds 2

Write-Host "   ✅ 已恢复"

# 5. Execute init.sql
Write-Host "`n📦 执行 Schema 初始化..." -ForegroundColor Yellow
$env:PGPASSWORD = $NEWPASS
$initSql = Join-Path $PSScriptRoot "..\prisma\init.sql"
& "$PGBIN\psql.exe" -U postgres -d saltlake -f $initSql 2>&1
Write-Host "   ✅ Schema 创建完成"

# 6. Done
Write-Host "`n🎉 PostgreSQL 初始化完成！" -ForegroundColor Green
Write-Host "   Database: saltlake"
Write-Host "   User:     postgres"
Write-Host "   Password: $NEWPASS"
Write-Host ""
Write-Host "现在可以运行数据迁移: npx tsx prisma/migrate.ts" -ForegroundColor Cyan
