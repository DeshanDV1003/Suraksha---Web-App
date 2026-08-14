@echo off
title Suraksha Web App — Launcher
color 0B

echo.
echo  ============================================
echo    SURAKSHA — Starting all services...
echo  ============================================
echo.

:: ── Step 1: Start PostgreSQL ─────────────────────────────────────────────────
echo  [1/3] Starting PostgreSQL database...
"D:\PostgreSQL\pgsql\bin\pg_ctl" -D "D:\OdooData\pgdata" status >nul 2>&1
if %errorlevel% equ 0 (
    echo  [✓] PostgreSQL already running — skipping start.
) else (
    "D:\PostgreSQL\pgsql\bin\pg_ctl" -D "D:\OdooData\pgdata" start -l "D:\OdooData\pgdata\postgres.log"
    timeout /t 3 /nobreak >nul
)

:: ── Step 2 & 3: Start backend + frontend via concurrently ────────────────────
echo.
echo  [2/3] Starting backend  ^(http://localhost:3001^)...
echo  [3/3] Starting frontend ^(http://localhost:5174^)...
echo.
echo  ============================================
echo    All services launching. Press Ctrl+C to
echo    stop everything at once.
echo  ============================================
echo.

cd /d "%~dp0"
npm run dev

pause
