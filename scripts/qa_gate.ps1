# qa_gate.ps1 - Marathon Quality Gate
# Usage: ./scripts/qa_gate.ps1

$ErrorActionPreference = "Stop"

Write-Host "== Nash Domik QA Gate ==" -ForegroundColor Cyan

function Run-Checked {
  param (
    [Parameter(Mandatory = $true)]
    [string]$Exe,
    [string[]]$CliArgs = @()
  )

  & $Exe @CliArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Host "GATE FAIL: $Exe $($CliArgs -join ' ') exited with code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

# 1) Basic repo structure checks
Write-Host "[1/4] Checking docs + tasks..." -ForegroundColor Cyan
Run-Checked "python" @("./scripts/checklist_gate.py")
Run-Checked "python" @("./scripts/task_gate.py")

# 2) Encoding checks
Write-Host "[2/4] Checking encoding (UTF-8/no-BOM/mojibake)..." -ForegroundColor Cyan
Run-Checked "python" @("./scripts/encoding_gate.py")

# 3) Node gates once code exists
if (Test-Path "./package.json") {
  Write-Host "[3/4] Node gates..." -ForegroundColor Cyan

  $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if ($npmCmd) {
    & $npmCmd --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "GATE FAIL: npm --version exited with code $LASTEXITCODE" -ForegroundColor Red
      exit $LASTEXITCODE
    }

    if (Test-Path "./node_modules") {
      Run-Checked $npmCmd @("run", "-s", "lint")
      Run-Checked $npmCmd @("run", "-s", "test")
      Run-Checked $npmCmd @("run", "-s", "build")
    } else {
      Write-Host "node_modules not found. Skipping lint/test/build (run npm install)." -ForegroundColor Yellow
    }
  } else {
    Write-Host "npm not found. Skipping Node gates." -ForegroundColor Yellow
  }
} else {
  Write-Host "package.json not found. Skipping Node gates (docs-only repo)." -ForegroundColor Yellow
}

Write-Host "[4/4] Gate PASSED" -ForegroundColor Green
