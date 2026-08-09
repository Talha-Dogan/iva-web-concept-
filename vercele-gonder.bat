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
  echo Once https://git-scm.com/download/win adresinden kurup tekrar dene.
  echo.
  pause
  exit /b 1
)

rem Netlify'a ait eski ayar dosyasi; Vercel'de islevi yok.
if exist "_headers" (
  echo Eski Netlify dosyasi siliniyor: _headers
  del "_headers"
)

if not exist ".git" (
  echo Git deposu baslatiliyor...
  git init -b main || goto :fail
  git remote add origin https://github.com/Talha-Dogan/iva-web-concept-.git || goto :fail
  echo Uzak depo bilgisi aliniyor...
  git fetch origin main || goto :fail
  rem Calisma klasorune dokunmadan gecmisi devral, boylece zorla push gerekmez.
  git reset --soft FETCH_HEAD || goto :fail
) else (
  git remote get-url origin >nul 2>&1
  if errorlevel 1 git remote add origin https://github.com/Talha-Dogan/iva-web-concept-.git
)

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

git commit -m "Siteyi yenile: 3B urun gorunumu, kullanim senaryolari, kiosk bolumu, fiyatlandirma yerine Cok Yakinda" || goto :fail

echo.
echo GitHub'a gonderiliyor... (giris istenirse tarayicidan onayla)
git push -u origin main || goto :fail

echo.
echo ============================================
echo   TAMAM. Vercel otomatik yayina alacak.
echo   1-2 dakika sonra kontrol et:
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
