$files = Get-ChildItem -Path "src\modules" -Recurse -Filter "*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '@/shared') {
        $content = $content -replace '@/shared', '../../shared'
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}
Write-Host "Done!"
