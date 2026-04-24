@echo off
echo ==============================================
echo BAT DAU QUA TRINH BUILD IOS QUA EXPO EAS
echo ==============================================

:: Bo qua kiem tra Git
set EAS_NO_VCS=1

:: Tien hanh build
call eas.cmd build --platform ios

echo.
echo ==============================================
echo QUA TRINH KET THUC. Nhan phim bat ky de thoat.
echo ==============================================
pause
