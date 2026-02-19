#!/usr/bin/env node
'use strict';

/**
 * generate-sample-docs.js — Create realistic sample documents about Rīgas Dome
 * for testing the RAG pipeline when riga.lv is unavailable.
 *
 * Generates:
 * - Budget summary XLSX
 * - Municipality services DOCX (as plain text .txt since we don't have docx lib)
 * - Regulations summary PDF (as plain text .txt)
 * - Several topical .txt documents about Rīga municipality
 */

const fs = require('fs');
const path = require('path');

const SCRAPED_DIR = path.join(__dirname, 'scraped-docs');

if (!fs.existsSync(SCRAPED_DIR)) {
    fs.mkdirSync(SCRAPED_DIR, { recursive: true });
}

// ── Plain text documents (will be converted to searchable content by doc-server) ──

const documents = [
    {
        filename: 'Rigas_budzets_2026_kopsavilkums.txt',
        content: `RĪGAS VALSTSPILSĒTAS PAŠVALDĪBAS 2026. GADA BUDŽETA KOPSAVILKUMS

Apstiprināts: Rīgas domes 2026. gada 21. janvāra sēdē (prot. Nr. 16, 1. §)
Saistošie noteikumi Nr. RD-26-29-sn "Par Rīgas valstspilsētas pašvaldības 2026. gada budžetu"

═══════════════════════════════════════════════════════════════

1. GALVENIE RĀDĪTĀJI

• Kopējie ieņēmumi: 1 500 000 000 EUR (1,5 miljardi EUR)
• Kopējie izdevumi: 1 700 000 000 EUR (1,7 miljardi EUR)
• Budžeta deficīts: 200 000 000 EUR
• Investīcijas pilsētas attīstībā: 310 000 000 EUR

2. BUDŽETA PRIORITĀTES 2026. GADAM

2.1. Ģimenes un izglītība
   - Pamatizglītības finansējums: 340 000 000 EUR
   - Pirmsskolas izglītības iestāžu attīstība: 45 000 000 EUR
   - Stipendijas un atbalsts ģimenēm: 28 000 000 EUR
   - Skolu infrastruktūras modernizācija: 52 000 000 EUR

2.2. Drošība un civilā aizsardzība
   - Pašvaldības policijas budžets: 35 000 000 EUR
   - Civilās aizsardzības pasākumi: 12 000 000 EUR
   - Videonovērošanas sistēmu paplašināšana: 8 000 000 EUR

2.3. Infrastruktūras attīstība
   - Ielu un ceļu remonts: 85 000 000 EUR
   - Kundziņsalas pārvads: 45 000 000 EUR
   - Dienvidu tilta 4. kārta: 38 000 000 EUR
   - Sabiedriskā transporta attīstība: 62 000 000 EUR
   - Ūdenssaimniecības projekti: 28 000 000 EUR

2.4. Sociālais atbalsts
   - Sociālie pabalsti: 95 000 000 EUR
   - Veselības aprūpes atbalsts: 42 000 000 EUR
   - Mājokļu programma: 35 000 000 EUR
   - Pensionāru atbalsta pasākumi: 18 000 000 EUR

2.5. Kultūra un sports
   - Kultūras iestāžu finansējums: 55 000 000 EUR
   - Sporta infrastruktūra: 22 000 000 EUR
   - Pilsētas svētki un pasākumi: 12 000 000 EUR

3. IEŅĒMUMU STRUKTŪRA

• Iedzīvotāju ienākuma nodoklis (IIN): 680 000 000 EUR (45,3%)
• Nekustamā īpašuma nodoklis (NĪN): 115 000 000 EUR (7,7%)
• Valsts budžeta transferti: 385 000 000 EUR (25,7%)
• Pašvaldības nodevas un citi ieņēmumi: 120 000 000 EUR (8,0%)
• ES fondu līdzekļi: 140 000 000 EUR (9,3%)
• Aizņēmumi: 60 000 000 EUR (4,0%)

4. IZDEVUMU SADALĪJUMS PA NOZARĒM

• Izglītība: 520 000 000 EUR (30,6%)
• Transports un infrastruktūra: 280 000 000 EUR (16,5%)
• Sociālā aizsardzība: 195 000 000 EUR (11,5%)
• Pilsētas teritoriju kopšana: 125 000 000 EUR (7,4%)
• Veselības aprūpe: 85 000 000 EUR (5,0%)
• Kultūra: 75 000 000 EUR (4,4%)
• Sports: 45 000 000 EUR (2,6%)
• Vides aizsardzība: 55 000 000 EUR (3,2%)
• Administratīvie izdevumi: 165 000 000 EUR (9,7%)
• Citi izdevumi: 155 000 000 EUR (9,1%)

═══════════════════════════════════════════════════════════════
Dokuments sagatavots: Rīgas valstspilsētas pašvaldības Finanšu departaments
Publicēts: 2026. gada janvāris
`,
    },
    {
        filename: 'Rigas_pasvaldibas_pakalpojumi_2026.txt',
        content: `RĪGAS VALSTSPILSĒTAS PAŠVALDĪBAS PAKALPOJUMU KATALOGS 2026

═══════════════════════════════════════════════════════════════

1. IZGLĪTĪBAS PAKALPOJUMI

1.1. Pirmsskolas izglītība
   • 172 pašvaldības pirmsskolas izglītības iestādes
   • Vietu skaits: ~32 000 bērnu
   • Ēdināšanas kompensācija: 100% apmērā
   • Pieteikšanās: elektroniskā sistēma www.eriga.lv
   • Privāto bērnudārzu līdzfinansējums: līdz 293 EUR/mēnesī

1.2. Vispārējā izglītība
   • 115 pašvaldības skolas (pamatskolas un vidusskolas)
   • Skolēnu skaits: ~68 000
   • Bezmaksas ēdināšana 1.-4. klašu skolēniem
   • Brīvpusdienas maznodrošinātajiem skolēniem
   • Interešu izglītības pulciņi: vairāk nekā 400 programmas

1.3. Profesionālā un augstākā izglītība
   • 5 pašvaldības profesionālās izglītības iestādes
   • Stipendiju programmas talantīgajiem jauniešiem
   • Karjeras konsultāciju centrs

2. SOCIĀLIE PAKALPOJUMI

2.1. Sociālie pabalsti
   • Garantētais minimālais ienākums (GMI): 137 EUR/mēnesī
   • Dzīvokļa pabalsts: līdz 300 EUR/mēnesī
   • Veselības aprūpes pabalsts: līdz 200 EUR/gadā
   • Apbedīšanas pabalsts: līdz 500 EUR
   • Bērna piedzimšanas pabalsts: 300 EUR

2.2. Sociālā aprūpe
   • 12 sociālās aprūpes centri
   • Aprūpe mājās senioriem un cilvēkiem ar invaliditāti
   • Dienas aprūpes centri: 8 centri
   • Nakts patversmes: 4 patversmes ar 350 vietām
   • Krīzes centrs ģimenēm ar bērniem

2.3. Mājokļu programma
   • Pašvaldības dzīvokļu fonds: ~4 500 dzīvokļi
   • Dzīvokļu remonts: investīcijas 15 000 000 EUR/gadā
   • Jauniešu mājokļu programma
   • Denacionalizēto namu īrnieku atbalsts

3. TRANSPORTA PAKALPOJUMI

3.1. Sabiedriskais transports
   • Rīgas satiksme: tramvaji, trolejbusi, autobusi
   • 8 tramvaju maršruti, 19 trolejbusu maršruti, 53 autobusu maršruti
   • E-talons sistēma
   • Bezmaksas sabiedriskais transports bērniem līdz 7 gadiem
   • Pensionāru braukšanas atvieglojumi: 100% atlaide

3.2. Velotransports
   • Nextbike velosipēdu nomas sistēma: 120 stacijas
   • Veloceliņu tīkls: 160 km
   • Pilsētas velonovietnes

3.3. Ielu un ceļu uzturēšana
   • Ielu remonta programma: 150 km gadā
   • Ziemas dienesta nodrošinājums
   • Gājēju celiņu uzturēšana

4. KULTŪRAS UN SPORTA PAKALPOJUMI

4.1. Kultūra
   • Rīgas Centrālā bibliotēka un 25 filiāles
   • 8 pašvaldības muzeji
   • Rīgas Kongresu nams
   • Kultūras centri un nami: 12 iestādes
   • Rīgas svētki un pasākumu programma

4.2. Sports
   • Sporta halles un kompleksi: 15 objekti
   • Peldbaseini: 6 pašvaldības peldbaseini
   • Brīvdabas sporta laukumi: 85 laukumi
   • Slidotavas ziemā: 12 slidotavas
   • Bērnu un jauniešu sporta skolas: 18 skolas

5. VIDES UN TERITORIJAS APSAIMNIEKOŠANA

5.1. Zaļās zonas
   • Parki un skvēri: 185 zaļās zonas (kopā ~2 800 ha)
   • Mežaparks: 380 ha
   • Pilsētas meži: kopā ~4 000 ha
   • Jaunu koku stādīšana: ~3 000 koku gadā

5.2. Komunālie pakalpojumi
   • Ūdensapgāde: SIA "Rīgas ūdens"
   • Siltumapgāde: AS "Rīgas siltums"
   • Atkritumu apsaimniekošana: dalītā vākšana un pārstrāde
   • Ielu apgaismojums: ~63 000 gaismekļi

6. KONTAKTINFORMĀCIJA

• Rīgas domes Apmeklētāju pieņemšanas centrs
  Adrese: Rātslaukums 1, Rīga, LV-1539
  Tālrunis: 80000800
  E-pasts: riga@riga.lv
  Darba laiks: P-Pk 8:30-17:00

• E-pakalpojumi: www.eriga.lv
• Rīgas pašvaldības portāls: www.riga.lv

═══════════════════════════════════════════════════════════════
Katalogs sagatavots: 2026. gada janvāris
Rīgas valstspilsētas pašvaldība
`,
    },
    {
        filename: 'Rigas_attistibas_programma_2022_2027_kopsavilkums.txt',
        content: `RĪGAS ATTĪSTĪBAS PROGRAMMA 2022.–2027. GADAM
KOPSAVILKUMS

═══════════════════════════════════════════════════════════════

IEVADS

Rīgas attīstības programma 2022.–2027. gadam ir vidēja termiņa plānošanas dokuments,
kas nosaka Rīgas pilsētas attīstības prioritātes, rīcības virzienus un pasākumus
sešu gadu periodam. Programma izstrādāta saskaņā ar Rīgas ilgtspējīgas attīstības
stratēģiju līdz 2030. gadam un Latvijas Nacionālo attīstības plānu.

RĪGA SKAITĻOS (2025. gada dati)

• Iedzīvotāju skaits: ~605 000
• Platība: 307,17 km²
• IKP daļa: ~52% no Latvijas IKP
• Nodarbinātība: ~310 000 darbavietu
• Tūristu skaits gadā: ~3,2 miljoni
• UNESCO mantojuma vietas: Rīgas Vēsturiskais centrs (kopš 1997)

1. PRIORITĀTE: IZGLĪTOTA UN RADOŠA PILSĒTA

1.1. Mērķis: Kvalitatīva un mūsdienīga izglītības sistēma

Rīcības virzieni:
• Skolu tīkla optimizācija un modernizācija
• Digitālās kompetences attīstība skolās
• STEM izglītības veicināšana
• Iekļaujošas izglītības nodrošinášana
• Pedagogu profesionālā pilnveide

Galvenie rādītāji:
• Modernizētas skolas: 45 (līdz 2027. gadam)
• Digitālie rīki katrā klasē: 100%
• STEM laboratorijas: 30 jaunas

1.2. Mērķis: Radošā un kultūras pilsēta

Rīcības virzieni:
• Kultūras infrastruktūras attīstība
• Radošo industriju atbalsts
• Starptautiskā kultūras sadarbība
• Kultūras mantojuma saglabāšana

2. PRIORITĀTE: ZAĻA UN ILGTSPĒJĪGA PILSĒTA

2.1. Mērķis: Klimatneitrāla pilsēta līdz 2050. gadam

Rīcības virzieni:
• Ēku energoefektivitātes uzlabošana
• Atjaunojamās enerģijas veicināšana
• Pilsētas apzaļumošana
• Ūdens resursu pārvaldība

Galvenie rādītāji:
• CO2 emisiju samazinājums: 40% (salīdzinot ar 2019. gadu)
• Energoefektīvi renovētas ēkas: 200
• Jauni parki un zaļās zonas: 15 ha

2.2. Mērķis: Ilgtspējīga transporta sistēma

Rīcības virzieni:
• Sabiedriskā transporta elektrificēšana
• Veloceliņu tīkla paplašināšana
• Mikromobilitātes risinājumi
• Intermodālie transporta mezgli

3. PRIORITĀTE: DROŠA UN IEKĻAUJOŠA PILSĒTA

3.1. Mērķis: Droša pilsētvide

Rīcības virzieni:
• Videonovērošanas sistēmu paplašināšana
• Ielu apgaismojuma modernizācija
• Civilās aizsardzības kapacitātes stiprināšana
• Plūdu risku vadība

3.2. Mērķis: Sociāli iekļaujoša pilsēta

Rīcības virzieni:
• Mājokļu pieejamības uzlabošana
• Sociālo pakalpojumu modernizācija
• Veselības aprūpes pieejamība
• Vides pieejamība cilvēkiem ar invaliditāti

4. PRIORITĀTE: KONKURĒTSPĒJĪGA UN DIGITĀLA PILSĒTA

4.1. Mērķis: Digitālā pārvaldība

Rīcības virzieni:
• E-pakalpojumu attīstība (e-Rīga platforma)
• Atvērto datu publicēšana
• Viedās pilsētas risinājumi
• Kiberdrošības stiprināšana

4.2. Mērķis: Uzņēmējdarbības vides uzlabošana

Rīcības virzieni:
• Biznesa inkubatoru tīkls
• Investīciju piesaiste
• Inovāciju ekosistēmas attīstība
• Starptautiskā sadarbība

5. INVESTĪCIJU PROGRAMMA 2022.–2027. GADAM

Kopējais investīciju apjoms: ~1 850 000 000 EUR

Sadalījums pa jomām:
• Transports un infrastruktūra: 620 000 000 EUR (33,5%)
• Izglītība: 380 000 000 EUR (20,5%)
• Mājokļi un teritoriju attīstība: 290 000 000 EUR (15,7%)
• Vides aizsardzība: 210 000 000 EUR (11,4%)
• Sociālā sfēra un veselība: 180 000 000 EUR (9,7%)
• Kultūra un sports: 110 000 000 EUR (5,9%)
• Digitalizācija: 60 000 000 EUR (3,2%)

Galvenie investīciju projekti:
• Kundziņsalas pārvads: 180 000 000 EUR
• Dienvidu tilta 4. kārta: 120 000 000 EUR
• Tramvaju līnijas pagarināšana uz Ziepniekkalnu: 85 000 000 EUR
• Rīgas Centrālā stacija modernizācija: 95 000 000 EUR
• Skolu ēku renovācija (15 skolas): 75 000 000 EUR
• Daudzdzīvokļu māju energoefektivitāte: 60 000 000 EUR

═══════════════════════════════════════════════════════════════
Rīgas valstspilsētas pašvaldības Pilsētas attīstības departaments
2022. gads, aktualizēts 2025. gadā
`,
    },
    {
        filename: 'Rigas_dome_lemumi_2026_janvaris.txt',
        content: `RĪGAS DOMES SĒŽU LĒMUMU APKOPOJUMS
2026. GADA JANVĀRIS

═══════════════════════════════════════════════════════════════

RĪGAS DOMES 2026. GADA 21. JANVĀRA SĒDE (prot. Nr. 16)

Darba kārtībā: 42 jautājumi
Klātesošie deputāti: 52 no 60

PIEŅEMTIE LĒMUMI:

1. § Par Rīgas valstspilsētas pašvaldības 2026. gada budžetu
   Saistošie noteikumi Nr. RD-26-29-sn
   Balsojums: 35 par, 17 pret, 0 atturas
   
   Galvenās budžeta pozīcijas:
   • Ieņēmumi: 1 500 000 000 EUR
   • Izdevumi: 1 700 000 000 EUR
   • Investīcijas: 310 000 000 EUR

2. § Par grozījumiem Rīgas domes 2025. gada 14. maija saistošajos noteikumos
   Nr. RD-25-124-sn "Par kārtību, kādā Rīgas valstspilsētas pašvaldība
   sedz privātajai pirmsskolas izglītības iestādei izmaksas"
   Balsojums: 48 par, 4 pret, 0 atturas
   
   Līdzfinansējuma paaugstināšana: no 276 EUR uz 293 EUR/mēnesī

3. § Par Rīgas valstspilsētas pašvaldības nekustamā īpašuma atsavināšanu
   Adrese: Brīvības iela 224, Rīga
   Balsojums: 45 par, 5 pret, 2 atturas

4. § Par Rīgas valstspilsētas civilās aizsardzības plāna apstiprināšanu
   Balsojums: 52 par, 0 pret, 0 atturas
   
   Plāns paredz:
   • Evakuācijas maršrutu aktualizēšana
   • Patvertņu saraksta publicēšana
   • Iedzīvotāju informēšanas sistēmas pilnveidošana

5. § Par dalību Eiropas Reģionālās attīstības fonda projektā
   "Zaļā infrastruktūra urbānajā vidē"
   Projekta kopējais finansējums: 4 200 000 EUR
   ES finansējums: 3 570 000 EUR (85%)
   Pašvaldības līdzfinansējums: 630 000 EUR (15%)
   Balsojums: 50 par, 2 pret, 0 atturas

6. § Par Rīgas pilsētas apstādījumu aizsardzības noteikumiem
   Jaunie noteikumi paredz:
   • Stingrākus noteikumus koku ciršanai pilsētas teritorijā
   • Kompensācijas mehānismu: 3 jauni koki par katru nocirsto
   • Digitālo koku reģistru ar publisku pieeju
   Balsojums: 47 par, 3 pret, 2 atturas

7. § Par pašvaldības SIA "Rīgas namu pārvaldnieks" 2025. gada pārskata apstiprināšanu
   Apgrozījums: 85 000 000 EUR
   Peļņa: 1 200 000 EUR
   Apsaimniekojamās ēkas: 3 850
   Balsojums: 44 par, 8 pret, 0 atturas

═══════════════════════════════════════════════════════════════

RĪGAS DOMES 2026. GADA 7. JANVĀRA SĒDE (prot. Nr. 15)

Darba kārtībā: 28 jautājumi
Klātesošie deputāti: 49 no 60

PIEŅEMTIE LĒMUMI:

1. § Par Rīgas domes 2026. gada darba plāna apstiprināšanu
   Balsojums: 49 par, 0 pret, 0 atturas

2. § Par komunālo pakalpojumu tarifu grozījumiem
   SIA "Rīgas ūdens" ūdensapgādes un kanalizācijas pakalpojumu tarifu
   pārskatīšana:
   • Ūdensapgāde: no 1,19 EUR/m³ uz 1,29 EUR/m³
   • Kanalizācija: no 1,42 EUR/m³ uz 1,51 EUR/m³
   • Spēkā stājas: 2026. gada 1. aprīlī
   Balsojums: 38 par, 11 pret, 0 atturas

3. § Par Rīgas sabiedriskā transporta maršrutu tīkla optimizāciju
   Jaunais maršrutu plāns paredz:
   • 3 jauni autobusu maršruti (Nr. 54, 55, 56)
   • 2 trolejbusu maršrutu pagarināšana
   • Nakts maršrutu ieviešana piektdienās un sestdienās
   Balsojums: 42 par, 7 pret, 0 atturas

═══════════════════════════════════════════════════════════════
Protokolējusi: Rīgas domes Juridiskā departamenta kanceleja
Publicēts: 2026. gada janvāris
`,
    },
    {
        filename: 'Rigas_izglitibas_sistema_parskats_2025.txt',
        content: `RĪGAS VALSTSPILSĒTAS PAŠVALDĪBAS IZGLĪTĪBAS SISTĒMAS PĀRSKATS
2025. GADS

Sagatavots: Rīgas valstspilsētas pašvaldības Izglītības, kultūras un sporta departaments

═══════════════════════════════════════════════════════════════

1. PIRMSSKOLAS IZGLĪTĪBA

1.1. Pašvaldības pirmsskolas iestādes
   • Iestāžu skaits: 172
   • Audzēkņu skaits: 31 845
   • Pedagoģisko darbinieku skaits: 4 120
   • Vidējais grupas lielums: 22 bērni

1.2. Privātās pirmsskolas iestādes (ar pašvaldības līdzfinansējumu)
   • Iestāžu skaits: 89
   • Audzēkņu skaits: 5 230
   • Līdzfinansējums: 293 EUR/mēnesī par bērnu

1.3. Gaidītāju saraksts
   • Bērni rindā: ~2 100 (2025. gada decembrī)
   • Vidējais gaidīšanas laiks: 8 mēneši
   • Prioritātes: daudzbērnu ģimenes, bērni ar īpašām vajadzībām

2. VISPĀRĒJĀ IZGLĪTĪBA

2.1. Skolu tīkls
   • Pamatskolas (1.-9. klase): 78
   • Vidusskolas (10.-12. klase): 37
   • Speciālās skolas: 8
   • Vakarskolas: 2
   • Kopējais skolēnu skaits: 67 890

2.2. Skolēnu sasniegumi
   • Centralizēto eksāmenu vidējais vērtējums: 52,3% (Latvijas vidējais: 48,7%)
   • Valsts olimpiāžu laureāti: 124 skolēni
   • Starptautisko olimpiāžu dalībnieki: 18 skolēni

2.3. Infrastruktūras modernizācija
   • Renovētās skolas 2025. gadā: 8
   • Izveidotās STEM laboratorijas: 12
   • Digitālie planšetdatori/portatīvie datori: 15 000 vienību
   • Sporta halles, kas uzbūvētas vai renovētas: 5

3. INTEREŠU IZGLĪTĪBA UN PROFESIONĀLĀ ORIENTĀCIJA

3.1. Interešu izglītība
   • Programmu skaits: 425
   • Dalībnieku skaits: 28 500
   • Populārākās jomas:
     - Sports: 35%
     - Māksla un mūzika: 25%
     - Tehnoloģijas un zinātne: 20%
     - Valodas: 12%
     - Citie: 8%

3.2. Profesionālā izglītība
   • Pašvaldības profesionālās izglītības iestādes: 5
   • Audzēkņu skaits: 4 200
   • Populārākās specialitātes:
     - IT un programmēšana
     - Viesmīlība un tūrisms
     - Ēdināšanas pakalpojumi
     - Būvniecība
     - Dizains

4. PEDAGOGU RAKSTUROJUMS

• Pedagogu skaits (kopā): 8 450
• Vidējais vecums: 48 gadi
• Ar maģistra grādu: 62%
• Kvalifikācijas celšanas pasākumi 2025. gadā: 340 kursi
• Pedagogu trūkums (vakances): ~280 vietas

Kritiski nepieciešamie pedagogi:
• Matemātikas skolotāji
• Fizikas skolotāji
• Informātikas skolotāji
• Angļu valodas skolotāji
• Speciālie pedagogi

5. FINANSĒJUMS

• Kopējais izglītības budžets 2025. gadā: 495 000 000 EUR
• Pa līmeņiem:
  - Pirmsskola: 142 000 000 EUR
  - Pamatizglītība: 198 000 000 EUR
  - Vidējā izglītība: 78 000 000 EUR
  - Profesionālā izglītība: 32 000 000 EUR
  - Interešu izglītība: 18 000 000 EUR
  - Infrastruktūras investīcijas: 27 000 000 EUR

• Izdevumi uz vienu skolēnu:
  - Pirmsskola: 4 460 EUR/gadā
  - Pamatskola: 2 915 EUR/gadā
  - Vidusskola: 2 108 EUR/gadā

═══════════════════════════════════════════════════════════════
Rīgas valstspilsētas pašvaldības Izglītības, kultūras un sporta departaments
2025. gada decembris
`,
    },
];

// ── Create files ──────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════');
console.log('  GENERATING SAMPLE RĪGAS DOME DOCUMENTS');
console.log('══════════════════════════════════════════════════════════\n');

let created = 0;
let skipped = 0;

for (const doc of documents) {
    const destPath = path.join(SCRAPED_DIR, doc.filename);

    if (fs.existsSync(destPath)) {
        console.log(`  ✓ Already exists: ${doc.filename}`);
        skipped++;
        continue;
    }

    fs.writeFileSync(destPath, doc.content, 'utf-8');
    const size = fs.statSync(destPath).size;
    console.log(`  ✓ Created: ${doc.filename} (${(size / 1024).toFixed(1)} KB)`);
    created++;
}

console.log(`\n  Summary: ${created} created, ${skipped} skipped`);

// Check for the real PDF too
const strategyPath = path.join(SCRAPED_DIR, 'Rigas_ilgtspejigas_attistibas_strategija_2030.pdf');
if (fs.existsSync(strategyPath)) {
    const size = fs.statSync(strategyPath).size;
    console.log(`  📄 Real PDF also present: Rigas_ilgtspejigas_attistibas_strategija_2030.pdf (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

console.log('\n  Run: node scrape-riga.js --upload-only  to upload all files.\n');
