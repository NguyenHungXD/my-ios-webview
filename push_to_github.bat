@echo off
echo ==============================================
echo BAT DAU DAY DU AN LEN GITHUB
echo ==============================================

git config --global user.name "NguyenHung"
git config --global user.email "nguyenhung@github.com"

git init
git add .
git commit -m "Khoi tao du an va workflow"
git branch -M main
git remote add origin https://github.com/NguyenHungXD/my-ios-webview.git
git push -u origin main

echo.
echo ==============================================
echo QUA TRINH DAY LEN GITHUB HOAN TAT
echo Nhan phim bat ky de thoat.
echo ==============================================
pause
