$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  KKU COMED23 - Fast APK Background Builder" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\phupa\AppData\Local\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "`n[1/3] Syncing latest web assets to Android Project..." -ForegroundColor Yellow
cmd.exe /c "npx.cmd cap sync android"

Write-Host "`n[2/3] Compiling Debug APK with Gradle (No Android Studio GUI needed)..." -ForegroundColor Yellow
Set-Location "c:\KKUEDCOM23\android"
cmd.exe /c "gradlew.bat assembleDebug"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "  Build Completed Successfully!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Copy-Item "app\build\outputs\apk\debug\app-debug.apk" -Destination "..\kku-comed23.apk" -Force
    Write-Host "  APK Output: c:\KKUEDCOM23\kku-comed23.apk" -ForegroundColor Green
} else {
    Write-Host "`n[!] Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
}

Set-Location "c:\KKUEDCOM23"
