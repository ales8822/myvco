# scripts\prepend_path_comments.ps1
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path .).Path
$ignorePatterns = @(
    '__pycache__',
    '*.py[cod]',
    '*$py.class',
    '*.so',
    '.Python',
    'venv',
    'env',
    'ENV',
    '*.egg-info',
    'dist',
    'build',
    '*.db',
    '*.sqlite',
    '*.sqlite3',
    '.env',
    '.env.local',
    '.vscode',
    '.idea',
    '*.swp',
    '*.swo',
    'node_modules',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'backend\uploads'
)
function Should-Ignore($path) {
    foreach ($pattern in $ignorePatterns) {
        if ($path -like "*$pattern*") { return $true }
    }
    return $false
}
Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($root.Length + 1).Replace('\\', '/')
    if (Should-Ignore $relative) { return }
    $ext = $_.Extension.ToLower()
    switch ($ext) {
        '.py' { $comment = "# $relative" }
        '.js' { $comment = "// $relative" }
        '.jsx' { $comment = "// $relative" }
        '.ts' { $comment = "// $relative" }
        '.tsx' { $comment = "// $relative" }
        '.css' { $comment = "/* $relative */" }
        '.html' { $comment = "<!-- $relative -->" }
        '.md' { $comment = "<!-- $relative -->" }
        default { $comment = "# $relative" }
    }
    $content = Get-Content -Raw -Path $_.FullName
    if ($content -notmatch "^$([regex]::Escape($comment))") {
        Set-Content -Path $_.FullName -Value ("$comment`n" + $content)
        Write-Host "Updated $relative"
    }
}

