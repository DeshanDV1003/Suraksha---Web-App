@echo off
title Suraksha ML Service
color 0A

echo.
echo =======================================
echo   Suraksha ML Service - Starting...
echo =======================================
echo.

cd /d "D:\Suraksha - Web App\suraksha-ml"

echo Starting ML service on port 8000...
echo.

call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
