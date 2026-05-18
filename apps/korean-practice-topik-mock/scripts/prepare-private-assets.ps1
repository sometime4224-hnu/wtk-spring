param(
  [string]$Downloads = (Join-Path $env:USERPROFILE "Downloads"),
  [switch]$SkipPages,
  [switch]$SkipAudio
)

$ErrorActionPreference = "Stop"

$AppRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$PrivateRoot = Join-Path $AppRoot "private-assets"
$AudioRoot = Join-Path $AppRoot "assets\audio"
$QuestionsRoot = Join-Path $AppRoot "assets\questions"

function Ensure-Directory {
  param([string]$Path)
  New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Find-SourceFile {
  param(
    [string]$Pattern,
    [string]$Label
  )

  $matches = @(Get-ChildItem -LiteralPath $Downloads -File -Filter $Pattern -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending)

  if ($matches.Count -eq 0) {
    throw "Missing $Label in $Downloads. Pattern: $Pattern"
  }

  return $matches[0].FullName
}

Ensure-Directory $PrivateRoot

if (-not $SkipPages) {
  $pdfPath = Find-SourceFile "26-* 2.pdf" "source PDF"
  $pdftoppm = Get-Command pdftoppm -ErrorAction SilentlyContinue
  if (-not $pdftoppm) {
    throw "pdftoppm was not found. Install Poppler or add it to PATH."
  }
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) {
    throw "python was not found. Python with Pillow is required to crop question images."
  }

  $pagesDir = Join-Path $PrivateRoot "pages"
  Ensure-Directory $pagesDir
  Get-ChildItem -LiteralPath $pagesDir -Filter "book-*.jpg" -File -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

  $pageRanges = @(
    @{ First = 17; Last = 28 },
    @{ First = 48; Last = 54 }
  )

  foreach ($range in $pageRanges) {
    & $pdftoppm.Source -jpeg -r 125 -f $range.First -l $range.Last $pdfPath (Join-Path $pagesDir "book")
    if ($LASTEXITCODE -ne 0) {
      throw "PDF page image generation failed."
    }
  }

  Get-ChildItem -LiteralPath $pagesDir -Filter "book-*.jpg" -File | ForEach-Object {
    if ($_.BaseName -match "^book-0+(\d+)$") {
      $target = Join-Path $pagesDir ("book-{0}.jpg" -f [int]$Matches[1])
      if ($_.FullName -ne $target) {
        Move-Item -LiteralPath $_.FullName -Destination $target -Force
      }
    }
  }

  $questionsDir = $QuestionsRoot
  & $python.Source (Join-Path $PSScriptRoot "crop-question-assets.py") --pages-dir $pagesDir --output-dir $questionsDir
  if ($LASTEXITCODE -ne 0) {
    throw "Question image cropping failed."
  }

  $resolvedPages = Resolve-Path -LiteralPath $pagesDir -ErrorAction SilentlyContinue
  if ($resolvedPages -and $resolvedPages.Path.StartsWith($PrivateRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedPages.Path -Recurse -Force
  }

  $legacyQuestionsRoot = Join-Path $PrivateRoot "questions"
  if (Test-Path -LiteralPath $legacyQuestionsRoot) {
    $resolvedLegacyQuestions = (Resolve-Path -LiteralPath $legacyQuestionsRoot).Path
    if (-not $resolvedLegacyQuestions.StartsWith($PrivateRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to clear unexpected legacy questions directory: $resolvedLegacyQuestions"
    }
    Remove-Item -LiteralPath $resolvedLegacyQuestions -Recurse -Force
  }
}

if (-not $SkipAudio) {
  $zipMap = @(
    @{ Type = 4; Expected = 15; Pattern = "*4-20260518T025803Z-3-001.zip" },
    @{ Type = 5; Expected = 12; Pattern = "*5-20260518T025808Z-3-001.zip" }
  )

  $legacyAudioRoot = Join-Path $PrivateRoot "audio"
  if (Test-Path -LiteralPath $legacyAudioRoot) {
    $resolvedLegacyAudio = (Resolve-Path -LiteralPath $legacyAudioRoot).Path
    if (-not $resolvedLegacyAudio.StartsWith($PrivateRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to clear unexpected legacy audio directory: $resolvedLegacyAudio"
    }
    Remove-Item -LiteralPath $resolvedLegacyAudio -Recurse -Force
  }

  Ensure-Directory $AudioRoot
  if (Test-Path -LiteralPath $AudioRoot) {
    $resolvedAudio = (Resolve-Path -LiteralPath $AudioRoot).Path
    if (-not $resolvedAudio.StartsWith($AppRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to clear unexpected audio directory: $resolvedAudio"
    }
    Get-ChildItem -LiteralPath $resolvedAudio -Directory -Filter "type-*" -ErrorAction SilentlyContinue |
      ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }
  }

  $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("topik-mock-audio-" + [guid]::NewGuid().ToString("N"))
  Ensure-Directory $tempRoot

  try {
    foreach ($entry in $zipMap) {
      $zipPath = Find-SourceFile $entry.Pattern ("audio type " + $entry.Type + " zip")
      $extractDir = Join-Path $tempRoot ("type-{0}" -f $entry.Type)
      Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

      $typeDir = Join-Path $AudioRoot ("type-{0}" -f $entry.Type)
      Ensure-Directory $typeDir
      Get-ChildItem -LiteralPath $typeDir -Filter "q-*.mp3" -File -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

      $copied = @()
      $audioFiles = Get-ChildItem -LiteralPath $extractDir -Recurse -File |
        Where-Object { $_.Extension -match "^\.mp3$" }

      foreach ($file in $audioFiles) {
        $number = $null
        if ($file.BaseName -match "_([0-9]+)[^0-9]*$") {
          $number = [int]$Matches[1]
        } elseif ($file.BaseName -match "([0-9]+)[^0-9]*$") {
          $number = [int]$Matches[1]
        }

        if ($null -eq $number -or $number -lt 1 -or $number -gt $entry.Expected) {
          continue
        }

        $target = Join-Path $typeDir ("q-{0:00}.mp3" -f $number)
        Copy-Item -LiteralPath $file.FullName -Destination $target -Force
        $copied += $number
      }

      $unique = @($copied | Sort-Object -Unique)
      if ($unique.Count -ne $entry.Expected) {
        $missing = @(1..$entry.Expected | Where-Object { $unique -notcontains $_ })
        throw "Audio type $($entry.Type) count mismatch. Missing: $($missing -join ', ')"
      }

      Write-Host ("Audio type {0} ready: {1}" -f $entry.Type, $unique.Count)
    }
  } finally {
    $resolvedTemp = Resolve-Path -LiteralPath $tempRoot -ErrorAction SilentlyContinue
    $systemTemp = [System.IO.Path]::GetTempPath()
    if ($resolvedTemp -and $resolvedTemp.Path.StartsWith($systemTemp, [System.StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath $resolvedTemp.Path -Recurse -Force
    }
  }
}

Write-Host "private-assets ready: $PrivateRoot"
Write-Host "trackable question images ready: $QuestionsRoot"
Write-Host "trackable audio ready: $AudioRoot"
