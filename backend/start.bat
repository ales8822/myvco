# backend\start.bat
@echo off
call venv\Scripts\activate
uvicorn app.main:app --reload

