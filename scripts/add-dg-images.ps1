$src = "C:\Users\AJ\Downloads\uppercuts-20260731T074410Z-1-001\drive-download-20260809T050235Z-1-001"
$dest = "src\assets\projects\david-giampicollo\gallery"

$files = @(
    "dg-062-Edit.jpg",
    "dg-578.jpg",
    "dg-1500-Edit.jpg",
    "IMG_1372-Edit.jpg",
    "IMG_1420-Edit.jpg",
    "IMG_1501-Edit.jpg",
    "IMG_1530-Edit.jpg"
)

for ($i = 0; $i -lt $files.Count; $i++) {
    $num = "{0:00}" -f ($i + 5)
    Copy-Item -Path "$src\$($files[$i])" -Destination "$dest\$num.jpg" -Force
}

Write-Output "Copied $($files.Count) new images to david-giampicollo gallery (05-11)"