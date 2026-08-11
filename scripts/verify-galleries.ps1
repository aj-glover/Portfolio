Get-ChildItem -Path 'src\assets\projects' -Directory | ForEach-Object {
    $galleryPath = Join-Path $_.FullName 'gallery'
    if (Test-Path $galleryPath) {
        $count = (Get-ChildItem $galleryPath -File).Count
        Write-Output "$($_.Name): $count images"
    } else {
        Write-Output "$($_.Name): NO GALLERY FOLDER"
    }
}