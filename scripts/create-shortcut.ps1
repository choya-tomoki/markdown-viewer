# Markdown Viewer - デスクトップショートカット作成スクリプト

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$exePath = Join-Path $projectRoot "out\Markdown Viewer-win32-x64\Markdown Viewer.exe"
$exeDir = Join-Path $projectRoot "out\Markdown Viewer-win32-x64"
$iconPath = Join-Path $projectRoot "resources\icon.ico"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Markdown Viewer.lnk"

# ビルド済みexeの存在チェック
if (-not (Test-Path $exePath)) {
    Write-Host "[エラー] ビルド済みアプリが見つかりません: $exePath" -ForegroundColor Red
    Write-Host "先に 'npm run make' を実行してください。" -ForegroundColor Yellow
    exit 1
}

# ショートカット作成
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $exeDir
$shortcut.Description = "Markdown Viewer - WYSIWYG Markdown Editor"

# .icoがあればそれを使う、なければexeのアイコン
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
} else {
    $shortcut.IconLocation = "$exePath,0"
}

$shortcut.Save()

Write-Host "ショートカットを作成しました: $shortcutPath" -ForegroundColor Green
