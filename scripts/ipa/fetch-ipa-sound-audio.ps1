param(
   [string]$OutputDirectory = "public/audio/ipa/en-GB/sounds"
)

$ErrorActionPreference = "Stop"
$sourcePath = Join-Path $PSScriptRoot "ipa-audio-sources.json"
$sources = Get-Content -LiteralPath $sourcePath -Encoding UTF8 -Raw |
   ConvertFrom-Json
$outputPath = [System.IO.Path]::GetFullPath(
   (Join-Path (Get-Location) $OutputDirectory)
)
$headers = @{
   "User-Agent" = "BritishIPATool/1.0 (https://berkekaragoz.com/ipa)"
}

function Invoke-WithRetry {
   param(
      [scriptblock]$Action,
      [string]$Label
   )

   for ($attempt = 1; $attempt -le 4; $attempt++) {
      try {
         return & $Action
      }
      catch {
         if ($attempt -eq 4) {
            throw
         }

         Write-Host "Retrying $Label..."
         Start-Sleep -Seconds (2 * $attempt)
      }
   }
}

New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

foreach ($property in $sources.PSObject.Properties) {
   $id = $property.Name
   $filename = $property.Value
   $title = "File:$filename"
   $uri =
      "https://commons.wikimedia.org/w/api.php?action=query&prop=videoinfo" +
      "&viprop=url%7Cderivatives&format=json&formatversion=2&titles=" +
      [Uri]::EscapeDataString($title)

   $response = Invoke-WithRetry -Label $id -Action {
      Invoke-RestMethod -Uri $uri -Headers $headers
   }
   $page = $response.query.pages[0]
   $videoInfo = $page.videoinfo[0]
   $mp3 = $videoInfo.derivatives |
      Where-Object { $_.type -eq "audio/mpeg" } |
      Select-Object -First 1

   if (-not $mp3) {
      throw "No MP3 derivative is available for $title."
   }

   $destination = Join-Path $outputPath "$id.mp3"
   Invoke-WithRetry -Label $id -Action {
      Invoke-WebRequest -Uri $mp3.src -Headers $headers -OutFile $destination
   } | Out-Null
   Write-Host "Downloaded $id"
   Start-Sleep -Milliseconds 350
}
