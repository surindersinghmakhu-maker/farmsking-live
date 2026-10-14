Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\hp\.gemini\antigravity-ide\brain\8fd4a42b-5af8-4449-b5f9-a2f786b61b54\.user_uploaded\media_1791999138812.jpg")
Write-Host "Source image size: $($img.Width) x $($img.Height)"

# In 1024x1024, let's examine the 4 card areas
# Total width is 1024. The 4 cards are side-by-side at the bottom:
# Card 1 (Farming): ~x: 55 to 265, y: 640 to 940
# Card 2 (Gardening): ~x: 285 to 495, y: 640 to 940
# Card 3 (Crop Doctors): ~x: 515 to 725, y: 640 to 940
# Card 4 (Agri Store): ~x: 745 to 955, y: 640 to 940

$outDir = "C:\Users\hp\.gemini\antigravity-ide\brain\8fd4a42b-5af8-4449-b5f9-a2f786b61b54\scratch"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir }

# Let's crop just the icon areas inside each card
# Card 1 icon: x: 70, y: 650, w: 180, h: 140
# Card 2 icon: x: 305, y: 650, w: 165, h: 140
# Card 3 icon: x: 535, y: 650, w: 165, h: 140
# Card 4 icon: x: 760, y: 650, w: 170, h: 140

$crops = @(
    @{ Name = "test_farming"; X = 65; Y = 650; W = 190; H = 145 },
    @{ Name = "test_gardening"; X = 310; Y = 650; W = 160; H = 145 },
    @{ Name = "test_cropdoctors"; X = 535; Y = 650; W = 165; H = 145 },
    @{ Name = "test_agristore"; X = 760; Y = 650; W = 170; H = 145 }
)

foreach ($c in $crops) {
    $bmp = New-Object System.Drawing.Bitmap $c.W, $c.H
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $srcRect = New-Object System.Drawing.Rectangle $c.X, $c.Y, $c.W, $c.H
    $destRect = New-Object System.Drawing.Rectangle 0, 0, $c.W, $c.H
    $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $bmp.Save("$outDir\$($c.Name).png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Saved $($c.Name).png"
}
$img.Dispose()
