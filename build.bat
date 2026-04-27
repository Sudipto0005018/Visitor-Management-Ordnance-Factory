@echo off
echo Cleaning ...
rd /s /q build
mkdir build
echo Building frontend...
cd frontend
call npm run build > nul
cd ..
echo Copying frontend...
xcopy frontend\dist build\build /e /i /y > nul
echo Building frontend...
cd backend
call npm run build > nul
cd ..
echo Copying files ...
copy backend\main.bundle.js build\index.js
copy backend\package.json build\package.json
copy backend\package-lock.json build\package-lock.json
del backend\main.bundle.js

xcopy backend\uploads build\uploads /e /i /y > nul
xcopy backend\template build\template /e /i /y > nul
xcopy server build\server /e /i /y > nul
copy backend\.env build\.env /e /i /y > nul
copy install.bat build\install.bat > nul
copy server-run.bat build\server-run.bat > nul
call mysqldump -u root -p2026StrongPassword@955 abc_visitor_management > ./build/dump.sql
echo\
echo\
echo Build Done 
echo\
echo Press any key to exit ...
pause > nul