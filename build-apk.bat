@echo off
chcp 65001 > nul
echo ========================================================
echo   KKU COMED23 - Lightning Fast Android APK Builder
echo   (คอมไพล์เป็นไฟล์ APK โดยตรง ไม่ต้องเปิด Android Studio)
echo ========================================================
echo.

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\phupa\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%PATH%

echo [1/3] กำลังซิงค์ไฟล์เว็บล่าสุดสู่ Android Project...
call npm.cmd run sync-app 2>nul || call npx.cmd cap sync android

echo.
echo [2/3] กำลัง Build ไฟล์ APK ด้วย Gradle Wrapper (Background CLI)...
cd android
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   🎉 สร้างไฟล์ APK สำเร็จเรียบร้อยแล้ว!
    echo   ไฟล์อยู่ที่:
    echo   android\app\build\outputs\apk\debug\app-debug.apk
    echo ========================================================
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\kku-comed23.apk" > nul
    echo   คัดลอกไฟล์มาไว้ที่หน้าโฟลเดอร์หลักแล้ว: kku-comed23.apk
    echo ========================================================
) else (
    echo.
    echo [!] เกิดข้อผิดพลาดในการคอมไพล์ กรุณาตรวจสอบการตั้งค่า SDK
)

cd ..
pause
