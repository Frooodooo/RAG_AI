#!/usr/bin/env node
'use strict';

/**
 * scrape-riga.js — Download Rīgas Dome public documents and ingest them into the RAG pipeline.
 *
 * Usage:
 *   node scrape-riga.js                  # Download + Ingest (Directly via Node.js)
 *   node scrape-riga.js --download-only  # Just download
 *   node scrape-riga.js --ingest-only    # Ingest whatever is in scraped-docs/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const cheerio = require('cheerio'); // New dependency
const { processFile } = require('./process-docs'); // Direct ingestion bypasses n8n

// ── Config ──────────────────────────────────────────────────────────────────────

const SCRAPED_DIR = path.join(__dirname, 'scraped-docs');
const DELAY_MS = 2000; // pause between ingests

// ── Curated document URLs ──────────────────────────────────────────────────────
const DOCUMENTS = [
    // ── Public Annual Reports ──
    {
        url: 'https://www.riga.lv/lv/media/44253/download?attachment',
        filename: 'Rigas_publiskais_parskats_2024.pdf',
        description: 'Rīgas valstspilsētas pašvaldības publiskais pārskats 2024',
    },
    // ── Budget documents 2026 ──
    {
        url: 'https://www.riga.lv/lv/media/49656/download?attachment',
        filename: 'Rigas_budzets_2026_saistosie_noteikumi.pdf',
        description: 'Rīgas domes saistošie noteikumi par 2026. gada budžetu',
    },
    {
        url: 'https://www.riga.lv/lv/media/49657/download?attachment',
        filename: 'Rigas_konsolidetais_budzets_2026_1pielikums.xlsx',
        description: 'Rīgas konsolidētais budžets 2026 (1. pielikums)',
    },
    {
        url: 'https://www.riga.lv/lv/media/49658/download?attachment',
        filename: 'Rigas_pamatbudzeta_ienemumi_izdevumi_2026_2pielikums.xlsx',
        description: 'Rīgas pamatbudžeta ieņēmumi un izdevumi 2026 (2. pielikums)',
    },
    {
        url: 'https://www.riga.lv/lv/media/49665/download?attachment',
        filename: 'Rigas_budzeta_paskaidrojuma_raksts_2026.pdf',
        description: 'Paskaidrojuma raksts par Rīgas 2026. gada budžetu',
    },
    // ── Development Strategy ──
    {
        url: 'https://www.rdpad.lv/wp-content/uploads/2014/11/STRATEGIJA_WEB.pdf',
        filename: 'Rigas_ilgtspejigas_attistibas_strategija_2030.pdf',
        description: 'Rīgas ilgtspējīgas attīstības stratēģija līdz 2030. gadam',
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/** Fetch URL content (HTML) */
function fetchHtml(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            timeout: 30000,
        };
        const req = protocol.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                console.log(`    ⚠ Failed to fetch HTML ${url}: ${res.statusCode}`);
                res.resume();
                resolve(null);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', (err) => {
            console.log(`    ⚠ Error fetching HTML ${url}: ${err.message}`);
            resolve(null);
        });
    });
}

/** Follow redirects and download a URL to a file. Returns true on success. */
function downloadFile(url, destPath, maxRedirects = 5) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const options = {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: '*/*',
            },
            timeout: 30000,
        };

        const req = protocol.get(url, options, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                if (maxRedirects <= 0) {
                    console.log(`    ⚠ Too many redirects for ${url}`);
                    resolve(false);
                    return;
                }
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : new URL(res.headers.location, url).href;
                return resolve(downloadFile(redirectUrl, destPath, maxRedirects - 1));
            }

            if (res.statusCode !== 200) {
                console.log(`    ⚠ HTTP ${res.statusCode} for ${url}`);
                res.resume();
                resolve(false);
                return;
            }

            let dataTimeout;
            const resetDataTimeout = () => {
                clearTimeout(dataTimeout);
                dataTimeout = setTimeout(() => {
                    console.log(`    ⚠ Data timeout`);
                    res.destroy();
                    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                    resolve(false);
                }, 15000);
            };
            resetDataTimeout();

            const stream = fs.createWriteStream(destPath);
            res.on('data', () => resetDataTimeout());
            res.pipe(stream);
            stream.on('finish', () => {
                clearTimeout(dataTimeout);
                stream.close();
                const size = fs.statSync(destPath).size;
                if (size < 500) {
                    console.log(`    ⚠ File too small (${size} bytes)`);
                    fs.unlinkSync(destPath);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
            stream.on('error', (err) => {
                clearTimeout(dataTimeout);
                console.log(`    ⚠ Write error: ${err.message}`);
                resolve(false);
            });
        });

        req.on('timeout', () => {
            console.log(`    ⚠ Connection timeout`);
            req.destroy();
            resolve(false);
        });

        req.on('error', (err) => {
            console.log(`    ⚠ Download error: ${err.message}`);
            resolve(false);
        });
    });
}

// ── Crawler Logic ──────────────────────────────────────────────────────────────

async function crawlNews() {
    console.log('\n  → Crawling riga.lv News section...');
    const baseUrl = 'https://www.riga.lv';
    const newsUrl = 'https://www.riga.lv/lv/jaunumi';

    const html = await fetchHtml(newsUrl);
    if (!html) return;

    const $ = cheerio.load(html);
    const articles = [];
    const seenUrls = new Set(); // ⚡ Bolt: Use a Set for O(1) URL deduplication lookups

    // Select news items (adjust selector based on actual site structure)
    // Looking for generic article placeholders or links in the main content area
    $('a[href*="/lv/jaunumi/"]').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();
        if (href && title && title.length > 20) { // Avoid 'Learn more' links
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!seenUrls.has(fullUrl)) {
                seenUrls.add(fullUrl);
                articles.push({ url: fullUrl, title });
            }
        }
    });

    console.log(`  Found ${articles.length} potential articles.`);

    // Process top 5 recent articles
    for (const article of articles.slice(0, 5)) {
        const filename = `News-${article.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.txt`;
        const destPath = path.join(SCRAPED_DIR, filename);

        if (fs.existsSync(destPath)) {
            console.log(`  ✓ Already exists: ${filename}`);
            continue;
        }

        console.log(`  ↓ Fetching article: ${article.title}`);
        await sleep(1000); // Politeness
        const articleHtml = await fetchHtml(article.url);
        if (articleHtml) {
            const $a = cheerio.load(articleHtml);

            // Extract text from main content (adjust selector!)
            // Try to find the main article body container
            let content = $a('article').text().trim() || $a('.field--name-body').text().trim() || $a('main').text().trim();

            // Clean up whitespace
            content = content.replace(/\s+/g, ' ');

            const fileContent = `Title: ${article.title}\nURL: ${article.url}\nDate: ${new Date().toISOString()}\n\n${content}`;

            fs.writeFileSync(destPath, fileContent, 'utf8');
            console.log(`    ✓ Saved (${(fileContent.length / 1024).toFixed(1)} KB)`);
        }
    }
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const downloadOnly = args.includes('--download-only');
    const ingestOnly = args.includes('--ingest-only') || args.includes('--upload-only'); // alias
    const doDownload = !ingestOnly;
    const doIngest = !downloadOnly;

    if (!fs.existsSync(SCRAPED_DIR)) {
        fs.mkdirSync(SCRAPED_DIR, { recursive: true });
    }

    // ── Phase 1: Download ──
    if (doDownload) {
        console.log('\n══════════════════════════════════════════════════════════');
        console.log('  PHASE 1: DOWNLOADING RĪGAS DOME DOCUMENTS');
        console.log('══════════════════════════════════════════════════════════\n');

        // 1. Curated Downloads
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;

        for (const doc of DOCUMENTS) {
            const destPath = path.join(SCRAPED_DIR, doc.filename);
            if (fs.existsSync(destPath)) {
                console.log(`  ✓ Already exists: ${doc.filename}`);
                skipped++;
                continue;
            }
            console.log(`  ↓ Downloading: ${doc.filename}`);
            const ok = await downloadFile(doc.url, destPath);
            if (ok) {
                const size = fs.statSync(destPath).size;
                console.log(`    ✓ Saved (${(size / 1024).toFixed(0)} KB)`);
                downloaded++;
            } else {
                console.log(`    ✗ Failed`);
                failed++;
            }
            await sleep(500);
        }

        // 2. Crawl News
        await crawlNews();

        console.log(`\n  Summary: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed\n`);
    }

    // ── Phase 2: Ingest ──
    if (doIngest) {
        console.log('\n══════════════════════════════════════════════════════════');
        console.log('  PHASE 2: INGESTING INTO RAG PIPELINE (DIRECT)');
        console.log('══════════════════════════════════════════════════════════\n');

        const validExts = ['.pdf', '.docx', '.xlsx', '.doc', '.xls', '.txt'];
        const files = fs.readdirSync(SCRAPED_DIR)
            .filter((f) => validExts.includes(path.extname(f).toLowerCase()))
            .map((f) => path.join(SCRAPED_DIR, f));

        if (files.length === 0) {
            console.log('  No files to ingest.');
            return;
        }

        console.log(`  Found ${files.length} files to ingest.\n`);

        for (const filePath of files) {
            await processFile(filePath);
            await sleep(DELAY_MS);
        }
        console.log('\n  Ingestion complete. Run verify-pipeline.js to check status.\n');
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
