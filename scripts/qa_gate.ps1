# qa_gate.ps1 — Marathon Quality Gate
# Usage: ./scripts/qa_gate.ps1

$ErrorActionPreference = 'Stop'

Write-Host "== Nash Domik QA Gate ==" -ForegroundColor Cyan

# 1) Basic repo structure checks
Write-Host "[1/3] Checking docs + tasks..." -ForegroundColor Cyan
python ./scripts/checklist_gate.py
python ./scripts/task_gate.py

# 2) (Optional) Node gates once code exists
if (Test-Path "./package.json") {
  Write-Host "[2/3] Node gates..." -ForegroundColor Cyan

  if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm --version | Out-Null

    if (Test-Path "./node_modules") {
      npm run -s lint
      npm run -s test
      npm run -s build
    } else {
      Write-Host "node_modules not found. Skipping lint/test/build (run npm install)." -ForegroundColor Yellow
    }
  } else {
    Write-Host "npm not found. Skipping Node gates." -ForegroundColor Yellow
  }
} else {
  Write-Host "package.json not found. Skipping Node gates (docs-only repo)." -ForegroundColor Yellow
}

Write-Host "[3/3] Gate PASSED ✅" -ForegroundColor Green
