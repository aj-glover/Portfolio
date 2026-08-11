# Copy all photo shoot images into gallery folders with clean ordered names

$base = "C:\Users\AJ\Downloads\uppercuts-20260731T074410Z-1-001"
$dest = "src\assets\projects"

# 1. Uppercuts — Formal Menswear Editorial (8 images)
$src = "$base\uppercuts"
$files = @(
    "Firefly_Gemini Flash_edit the sky to be better 469961.png",
    "DSC_4791-Edit-2.jpg",
    "DSC_4679-Edit.jpg",
    "DSC_4712.jpg",
    "DSC_4836-Edit.jpg",
    "DSC_5118.jpg",
    "Firefly_Gemini Flash_fix the sky but dont change anything else or add anytning 693595.png",
    "Firefly_Gemini Flash_make the sky better, dont change anything else or add anything, make it look like mid 448795.png"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    $ext = [System.IO.Path]::GetExtension($files[$i])
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\uppercuts-editorial\gallery\$num$ext" -Force
}
Write-Output "Uppercuts: $($files.Count) images copied"

# 2. Kelow LaTesha — Submerged (4 images)
$src = "$base\AmazonPhotos (1)"
$files = @(
    "2019-08-12_10-27-24_005.jpeg",
    "2019-08-12_10-26-46_434.jpeg",
    "2019-08-12_10-26-58_686.jpeg",
    "2019-08-12_10-26-17_640.jpeg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\kelow-latesha-submerged\gallery\$num.jpeg" -Force
}
Write-Output "Kelow LaTesha: $($files.Count) images copied"

# 3. Wrapped — Material & Form (5 images)
$src = "$base\AmazonPhotos (3)"
$files = @(
    "2017-12-06_10-44-34_874.jpeg",
    "2017-12-06_10-44-40_075.jpeg",
    "2017-12-06_10-44-51_823.jpeg",
    "2017-12-06_10-44-43_003.jpeg",
    "2017-12-06_10-44-37_495.jpeg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\wrapped-material-form\gallery\$num.jpeg" -Force
}
Write-Output "Wrapped: $($files.Count) images copied"

# 4. Rollout — Street Style on Wheels (4 images)
$src = "$base\AmazonPhotos"
$files = @(
    "2019-10-15_18-04-24_990.jpeg",
    "2019-10-15_18-16-03_400.jpeg",
    "2019-10-15_18-16-54_300.jpeg",
    "2019-10-15_18-51-56_600.jpeg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\rollout-street-style\gallery\$num.jpeg" -Force
}
Write-Output "Rollout: $($files.Count) images copied"

# 5. Grace in Ruins (4 images)
$src = "$base\AmazonPhotos (2)"
$files = @(
    "2018-01-18_11-21-06_966.jpeg",
    "2018-01-18_11-16-44_208.jpeg",
    "2018-01-18_11-18-05_731.jpeg",
    "2018-01-18_11-21-01_797.jpeg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\grace-in-ruins\gallery\$num.jpeg" -Force
}
Write-Output "Grace in Ruins: $($files.Count) images copied"

# 6. Urban Frequency (8 images)
$src = "$base\YURO-20260731T152707Z-1-001\YURO"
$files = @(
    "DSC_5355.jpg",
    "DSC_5549.jpg",
    "DSC_5316.jpg",
    "DSC_5550.jpg",
    "DSC_5544.jpg",
    "DSC_5381.jpg",
    "DSC_5432.jpg",
    "DSC_5539.jpg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\urban-frequency\gallery\$num.jpg" -Force
}
Write-Output "Urban Frequency: $($files.Count) images copied"

# 7. After Hours (5 images)
$src = "$base\Photos-1-001 (1)"
$files = @(
    "_DSC3400-Edit.jpg",
    "_DSC2907-Edit.jpg",
    "_DSC2949-Edit.jpg",
    "_DSC3234-Edit.jpg",
    "_DSC3327-Edit.jpg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\after-hours\gallery\$num.jpg" -Force
}
Write-Output "After Hours: $($files.Count) images copied"

# 8. Jen Bunny (6 images)
$src = "$base\_DSC4160-Edit"
$files = @(
    "_DSC3929-Edit.jpg",
    "_DSC3955-Edit.jpg",
    "_DSC3994-Edit.jpg",
    "_DSC3577-Edit.jpg",
    "_DSC3632-Edit.jpg",
    "_DSC3922-Edit.jpg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\jen-bunny\gallery\$num.jpg" -Force
}
Write-Output "Jen Bunny: $($files.Count) images copied"

# 9. David Giampicollo (4 images)
$src = "C:\Users\AJ\Desktop\Work Samples\Photography"
$files = @(
    "3.jpg",
    "4.jpg",
    "5.jpg",
    "6.jpg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\david-giampicollo\gallery\$num.jpg" -Force
}
Write-Output "David Giampicollo: $($files.Count) images copied"

# 10. Product Photography (11 images)
$src = "C:\Users\AJ\Desktop\Work Samples\Photography"
$files = @(
    "_DSC2916.JPEG",
    "_DSC2987.JPEG",
    "_DSC4098.JPEG",
    "_DSC4121.JPEG",
    "_DSC5405-Edit.jpg",
    "1-DSC_0308.jpg",
    "4-DSC_0253.jpg",
    "878A9A92-E5B5-455F-9C56-C29E510F73EA.JPEG",
    "B0700711-AD93-4428-9148-A01C5D976D56.JPEG",
    "DSC_8495.JPEG",
    "peach final.jpg"
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 1)
    $ext = [System.IO.Path]::GetExtension($files[$i]).ToLower()
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\product-photography\gallery\$num$ext" -Force
}
Write-Output "Product Photography: $($files.Count) images copied"

Write-Output "`n=== All images copied successfully ==="