@echo off
echo Stopping PostgreSQL...
"D:\PostgreSQL\pgsql\bin\pg_ctl" -D "D:\OdooData\pgdata" stop
pause
