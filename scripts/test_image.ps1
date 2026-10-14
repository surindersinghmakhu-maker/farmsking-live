Add-Type -AssemblyName System.Drawing
Write-Host "System.Drawing loaded successfully!"
$bmp = New-Object System.Drawing.Bitmap 100, 100
Write-Host "Created bitmap: $($bmp.Width) x $($bmp.Height)"
$bmp.Dispose()
