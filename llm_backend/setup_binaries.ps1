$url = "https://github.com/ggerganov/llama.cpp/releases/download/b4724/llama-b4724-bin-win-avx2-x64.zip"
$zip = "llama_bin.zip"
$dest = "llama_bin"

Write-Host "Downloading llama.cpp tools..."
Invoke-WebRequest -Uri $url -OutFile $zip

if (Test-Path $zip) {
    Write-Host "Extracting binaries..."
    if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest }
    Expand-Archive -Path $zip -DestinationPath $dest -Force
    Remove-Item $zip
    Write-Host "Binaries extracted successfully to $dest"
} else {
    Write-Error "Failed to download zip file."
}
