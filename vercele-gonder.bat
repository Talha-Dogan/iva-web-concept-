@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   iva-web  ^>^>  GitHub  ^>^>  Vercel
echo ============================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [HATA] Git kurulu degil.
  echo https://git-scm.com/download/win adresinden kurup tekrar dene.
  echo.
  pause
  exit /b 1
)

if exist "_headers" del "_headers"

if not exist ".git" (
  echo Git deposu baslatiliyor...
  git init -b main || goto :fail
  git remote add origin https://github.com/Talha-Dogan/iva-web-concept-.git || goto :fail
  git fetch origin main || goto :fail
  git reset --soft FETCH_HEAD || goto :fail
)

rem Ham STL dosyalari 60 MB; siteye GLB surumleri gidiyor. Diskte kaliyorlar,
rem sadece depodan cikariliyorlar.
git rm --cached --ignore-unmatch -q "models/*.stl" >nul 2>&1

echo.
echo Gonderilecek degisiklikler:
git add -A || goto :fail
git status --short
echo.

git diff --cached --quiet
if not errorlevel 1 (
  echo Gonderilecek yeni bir degisiklik yok.
  echo.
  pause
  exit /b 0
)

git commit -m "3B gorunum v2 modeline guncellendi" || goto :fail

echo.
echo GitHub'a gonderiliyor... (giris istenirse tarayicidan onayla)
git push -u origin main || goto :fail

echo.
echo ============================================
echo   TAMAM. Vercel 1-2 dakika icinde yayinlar:
echo   https://iva-web-concept.vercel.app/
echo ============================================
echo.
pause
exit /b 0

:fail
echo.
echo [HATA] Islem tamamlanamadi. Yukaridaki mesaja bak.
echo.
pause
exit /b 1
