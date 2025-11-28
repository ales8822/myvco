@echo off
echo Starting MyVCO with PM2...

start http://localhost:5173

pm2 start ecosystem.config.js

pause
