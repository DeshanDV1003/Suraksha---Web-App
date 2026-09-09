@echo off
title Suraksha ML Service
color 0A

echo.
echo =======================================
echo   Suraksha ML Service - Starting...
echo =======================================
echo.

cd /d "D:\Suraksha - Web App\suraksha-ml"

REM Keep AI model weights on the project drive (C: is often full)
set "DEEPFACE_HOME=D:\Suraksha - Web App\suraksha-ml\models\deepface_home"

echo Starting ML service on port 8000...
echo.

call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
