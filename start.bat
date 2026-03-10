@echo off
echo Starting AgriAssist...
start "Backend" cmd /k "cd /d c:\cp\backend && npm run dev"
timeout /t 3
start "Frontend" cmd /k "cd /d c:\cp\frontend && npm run dev"
echo Both servers starting. Backend: http://localhost:5000 | Frontend: http://localhost:5173
