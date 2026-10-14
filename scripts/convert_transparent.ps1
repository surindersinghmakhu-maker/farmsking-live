Add-Type -AssemblyName System.Drawing

function Convert-WhiteToTransparent {
    param(
        [string]$InputPath,
        [string]$OutputPath
    )
    $src = [System.Drawing.Bitmap]::FromFile($InputPath)
    $w = $src.Width
    $h = $src.Height
    $dst = New-Object System.Drawing.Bitmap $w, $h

    # Flood-fill BFS to find all white background connected from corners/edges
    $visited = New-Object 'bool[,]' $w, $h
    $isBg = New-Object 'bool[,]' $w, $h
    $queue = New-Object System.Collections.Queue

    # Seed with perimeter
    for ($x = 0; $x -lt $w; $x++) {
        foreach ($y in @(0, $h - 1)) {
            $p = $src.GetPixel($x, $y)
            if ($p.R -ge 245 -and $p.G -ge 245 -and $p.B -ge 245) {
                $visited[$x, $y] = $true
                $isBg[$x, $y] = $true
                $queue.Enqueue(@($x, $y))
            }
        }
    }
    for ($y = 0; $y -lt $h; $y++) {
        foreach ($x in @(0, $w - 1)) {
            if (-not $visited[$x, $y]) {
                $p = $src.GetPixel($x, $y)
                if ($p.R -ge 245 -and $p.G -ge 245 -and $p.B -ge 245) {
                    $visited[$x, $y] = $true
                    $isBg[$x, $y] = $true
                    $queue.Enqueue(@($x, $y))
                }
            }
        }
    }

    while ($queue.Count -gt 0) {
        $pt = $queue.Dequeue()
        $cx = $pt[0]
        $cy = $pt[1]

        $neighbors = @(
            @($cx - 1, $cy),
            @($cx + 1, $cy),
            @($cx, $cy - 1),
            @($cx, $cy + 1)
        )

        foreach ($n in $neighbors) {
            $nx = $n[0]
            $ny = $n[1]
            if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                if (-not $visited[$nx, $ny]) {
                    $visited[$nx, $ny] = $true
                    $p = $src.GetPixel($nx, $ny)
                    # If it's near white background
                    if ($p.R -ge 242 -and $p.G -ge 242 -and $p.B -ge 242) {
                        $isBg[$nx, $ny] = $true
                        $queue.Enqueue(@($nx, $ny))
                    }
                }
            }
        }
    }

    # Now write pixels to destination
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            if ($isBg[$x, $y]) {
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $p = $src.GetPixel($x, $y)
                # Check if near background for antialiasing
                $hasBgNear = $false
                if ($x -gt 0 -and $isBg[$x - 1, $y]) { $hasBgNear = $true }
                elseif ($x -lt $w - 1 -and $isBg[$x + 1, $y]) { $hasBgNear = $true }
                elseif ($y -gt 0 -and $isBg[$x, $y - 1]) { $hasBgNear = $true }
                elseif ($y -lt $h - 1 -and $isBg[$x, $y + 1]) { $hasBgNear = $true }

                if ($hasBgNear -and $p.R -ge 220 -and $p.G -ge 220 -and $p.B -ge 220) {
                    $lum = (0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B)
                    $alpha = [int]([Math]::Max(0, [Math]::Min(255, (255 - $lum) * 7)))
                    $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
                } else {
                    $dst.SetPixel($x, $y, $p)
                }
            }
        }
    }

    $dst.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $src.Dispose()
    $dst.Dispose()
    Write-Host "Exported transparent PNG to $OutputPath"
}

$artifacts = "C:\Users\hp\.gemini\antigravity-ide\brain\8fd4a42b-5af8-4449-b5f9-a2f786b61b54"
$frontendImages = "D:\FarmsKing\frontend\assets\images"

Convert-WhiteToTransparent -InputPath "$artifacts\icon_farming_isolated_1792004257378.jpg" -OutputPath "$frontendImages\icon_farming_3d_clean.png"
Convert-WhiteToTransparent -InputPath "$artifacts\icon_gardening_isolated_1792004279678.jpg" -OutputPath "$frontendImages\icon_gardening_3d_clean.png"
Convert-WhiteToTransparent -InputPath "$artifacts\icon_cropdoctors_isolated_1792004302078.jpg" -OutputPath "$frontendImages\icon_cropdoctors_3d_clean.png"
Convert-WhiteToTransparent -InputPath "$artifacts\icon_agristore_isolated_1792004320548.jpg" -OutputPath "$frontendImages\icon_agristore_3d_clean.png"
