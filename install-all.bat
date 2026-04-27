@echo off
REM Batch script to install npm packages in frontend and backend

echo Installing dependencies in frontend...
cd /d "%~dp0frontend"
call npm install

echo Installing dependencies in backend...
cd /d "%~dp0backend"
call npm install

echo All installations complete!
pause
