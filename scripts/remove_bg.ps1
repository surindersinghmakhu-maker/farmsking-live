Add-Type -AssemblyName System.Drawing

function Process-IconImage {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Threshold = 38,
        [int]$Softness = 18
    )
    $src = [System.Drawing.Bitmap]::FromFile($InputPath)
    $w = $src.Width
    $h = $src.Height
    $dst = New-Object System.Drawing.Bitmap $w, $h

    # Sample corners for background color
    $c1 = $src.GetPixel(1, 1)
    $c2 = $src.GetPixel($w - 2, 1)
    $c3 = $src.GetPixel(1, $h - 2)
    $c4 = $src.GetPixel($w - 2, $h - 2)
    $bgR = ($c1.R + $c2.R + $c3.R + $c4.R) / 4.0
    $bgG = ($c1.G + $c2.G + $c3.G + $c4.G) / 4.0
    $bgB = ($c1.B + $c2.B + $c3.B + $c4.B) / 4.0

    Write-Host "BG color: R=$([int]$bgR) G=$([int]$bgG) B=$([int]$bgB)"

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $src.GetPixel($x, $y)
            $diffR = $p.R - $bgR
            $diffG = $p.G - $bgG
            $diffB = $p.B - $bgB
            $dist = [Math]::Sqrt($diffR * $diffR + $diffG * $diffG + $diffB * $diffB)

            if ($dist -le $Threshold) {
                # Completely transparent
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } elseif ($dist -lt ($Threshold + $Softness)) {
                $alphaRatio = ($dist - $Threshold) / $Softness
                $alpha = [int]([Math]::Min(255, [Math]::Max(0, $alphaRatio * 255)))
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            } else {
                $dst.SetPixel($x, $y, $p)
            }
        }
    }

    $dst.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $src.Dispose()
    $dst.Dispose()
    Write-Host "Saved $OutputPath"
}

$scratch = "C:\Users\hp\.gemini\antigravity-ide\brain\8fd4a42b-5af8-4449-b5f9-a2f786b61b54\scratch"
Process-IconImage -InputPath "$scratch\test_farming.png" -OutputPath "$scratch\trans_farming.png" -Threshold 34 -Softness 16
Process-IconImage -InputPath "$scratch\test_gardening.png" -OutputPath "$scratch\trans_gardening.png" -Threshold 36 -Softness 16
Process-IconImage -InputPath "$scratch\test_cropdoctors.png" -OutputPath "$scratch\trans_cropdoctors.png" -Threshold 34 -Softness 16
Process-IconImage -InputPath "$scratch\test_agristore.png" -OutputPath "$scratch\trans_agristore.png" -Threshold 34 -Softness 16
