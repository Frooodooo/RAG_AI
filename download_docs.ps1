$dest = "C:\Users\Frooodooo\Documents\RAG_AI\test_documents"
$urls = @(
    "https://kulturasapvieniba.riga.lv/files/kodekss.pdf",
    "https://pip.riga.lv/uploads/Saimnieciska_Darbiba_Likme_Atvieglojumi_2025.pdf",
    "https://mvd.riga.lv/na/pozarotusenije.pdf",
    "https://pip.riga.lv/uploads/2_pielikums_RDSN_Nr_109_2023.docx",
    "https://mvd.riga.lv/uploads/departaments/Aptaujas_anketa_NI_apsaimniekotaja_maina_PARAUGS.docx",
    "https://sports.riga.lv/media/recentevents/DlLrFy3MobQfIoXm7lDwteb6FikqMQxS.doc",
    "https://iksd.riga.lv/media/Kopeja_pieskiruma_tabula.xlsx",
    "https://gmsd.riga.lv/downloads/RGKI_2022.xlsx",
    "https://sports.riga.lv/media/SportEventsFiles/5b112ef417308.xls"
)

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest
}

foreach ($url in $urls) {
    try {
        $filename = $url.Split('/')[-1]
        $outPath = Join-Path $dest $filename
        Write-Host "Downloading $url to $outPath..."
        Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
        Write-Host "Downloaded: $filename"
    }
    catch {
        Write-Error "Failed to download $url : $_"
    }
}
