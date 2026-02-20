$dest = "C:\Users\Frooodooo\Documents\RAG_AI\test_documents"
$files = @(
    @{ Url = "https://pip.riga.lv/uploads/Informacija-par-NIN-atvieglojumiem-NI-kurus-lieto-sabiedriska-labuma-organizacijas-2026.pdf"; Name = "Informacija-par-NIN-atvieglojumiem-2026.pdf" },
    @{ Url = "https://www.riga.lv/lv/media/59259/download?attachment"; Name = "Rigas_viedas_pilsetas_pamatnostadnes_2025_2030.pdf" },
    @{ Url = "https://ld.riga.lv/wp-content/uploads/2025/01/Prezentacija_LM_2024_budzets_Invalidu_padome_090125.pdf"; Name = "Prezentacija_LM_2025.pdf" },
    @{ Url = "https://grausti.riga.lv/wp-content/uploads/2026/02/PAKK_sedes_dk_13.02.2026.doc"; Name = "PAKK_sedes_dk_13.02.2026.doc" },
    @{ Url = "https://grausti.riga.lv/wp-content/uploads/2026/01/PAKK__sedes_dk_30.01.doc"; Name = "PAKK__sedes_dk_30.01.2026.doc" },
    @{ Url = "https://iksd.riga.lv/lv/download-file/purchases/1892"; Name = "Iepirkuma_nolikums_2026.doc" },
    @{ Url = "https://iksd.riga.lv/media/RD_IKSD/normativie%20akti2/Cenradis_1%20(ar%2021052025%20groz).xls"; Name = "Cenradis_2025.xls" },
    @{ Url = "https://grausti.riga.lv/wp-content/uploads/2025/03/buves_lemumi_21.03.2025.xls"; Name = "buves_lemumi_21.03.2025.xls" },
    @{ Url = "https://kultura.riga.lv/lv/download-file/financial-competition/3168"; Name = "NVO_Atbalsts_2025.xls" }
)

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest
}

foreach ($file in $files) {
    try {
        $outPath = Join-Path $dest $file.Name
        Write-Host "Downloading $($file.Url) to $outPath..."
        Invoke-WebRequest -Uri $file.Url -OutFile $outPath -ErrorAction Stop -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        Write-Host "Downloaded: $($file.Name)"
    }
    catch {
        Write-Error "Failed to download $($file.Url) : $_"
    }
}
