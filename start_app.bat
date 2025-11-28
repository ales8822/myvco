@echo off
echo Starting MyVCO...

:: Open Browser (will open in default browser)
start http://localhost:5173

:: Start both servers in this window
cd frontend
echo Starting Backend and Frontend servers...
echo Press Ctrl+C to stop both servers.
npm run dev:all

pause
