@echo off
set ROOT=%~dp0..
python "%ROOT%\tools\precompile_check.py" %*
