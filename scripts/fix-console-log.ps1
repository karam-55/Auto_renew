# PowerShell script to replace console.log/error/warn with Logger in backend controllers
# This replaces simple patterns - review output manually for complex cases

$backendDir = "$PSScriptRoot\..\backend\src\modules"

# Files to process (priority: controllers)
$controllers = Get-ChildItem -Path $backendDir -Recurse -Filter "*controller.ts"

foreach ($file in $controllers) {
    $content = Get-Content $file.FullName -Raw
    $original = $content

    # Check if Logger is already imported
    $hasLoggerImport = $content -match "import\s+\{\s*Logger\s*\}\s+from\s+['\"].*logging/logger['\"]"

    if (-not $hasLoggerImport -and ($content -match "console\.(log|error|warn|debug|info)")) {
        # Add Logger import at top
        $content = $content -replace "^(import .*`r?`n)", "`$1import { Logger } from '../../infrastructure/logging/logger';`r`n"
    }

    # Replace console.error('message:', error) patterns
    $content = $content -replace "console\.error\(['\"](.+?)['\"],\s*error\s*\)", "Logger.error('`$1', error)"
    $content = $content -replace "console\.error\(['\"](.+?)['\"],\s*(\w+)\s*\)", "Logger.error('`$1', `$2)"

    # Replace console.error('message:') patterns
    $content = $content -replace "console\.error\(['\"](.+?)['\"]\)", "Logger.error('`$1')"

    # Replace console.warn patterns
    $content = $content -replace "console\.warn\(['\"](.+?)['\"]\)", "Logger.warn('`$1')"

    # Replace console.log error patterns (commonly used for errors)
    $content = $content -replace "console\.log\(['\"]Error[:\s]*(.+?)['\"]\)", "Logger.error('`$1')"

    # Replace generic console.log in catch blocks - be conservative
    $content = $content -replace "console\.log\(['\"](.+?)(?:error|Error|fail|Fail)(.+?)['\"],\s*(\w+)\s*\)", "Logger.error('`$1`$2', `$3)"

    # Replace simple console.log with Logger.debug (safe for non-error logs)
    $content = $content -replace "console\.log\((['\"].+?['\"])\)", "Logger.debug(`$1)"

    if ($content -ne $original) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done! Review changes manually."
