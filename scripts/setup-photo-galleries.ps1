$dirs = @(
    'uppercuts-editorial',
    'kelow-latesha-submerged',
    'wrapped-material-form',
    'rollout-street-style',
    'grace-in-ruins',
    'urban-frequency',
    'after-hours',
    'jen-bunny',
    'david-giampicollo',
    'product-photography'
)

foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path "src\assets\projects\$d\gallery" | Out-Null
}

Write-Output 'All directories created'