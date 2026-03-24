@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Markdown Viewer - セットアップ
echo ========================================
echo.

cd /d "%~dp0.."

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] Node.js がインストールされていません。
    echo https://nodejs.org/ からインストールしてください。
    pause
    exit /b 1
)

echo [1/3] 依存パッケージをインストール中...
call npm install
if %errorlevel% neq 0 (
    echo [エラー] npm install に失敗しました。
    pause
    exit /b 1
)

echo.
echo [2/3] アプリをビルド中...
call npm run package
if %errorlevel% neq 0 (
    echo [エラー] ビルドに失敗しました。
    pause
    exit /b 1
)

echo.
echo [3/3] デスクトップショートカットを作成中...
powershell -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"
if %errorlevel% neq 0 (
    echo [警告] ショートカットの作成に失敗しました。手動で作成してください。
)

echo.
echo ========================================
echo   セットアップ完了！
echo   デスクトップの "Markdown Viewer" から起動できます。
echo ========================================
echo.
pause
