const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const SCRAPED_DIR = path.join(__dirname, 'scraped-docs');

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        console.log(`    ⚠ Error fetching HTML ${url}: ${error.message}`);
        return null;
    }
}

async function crawlNews() {
    console.log('\n  → Crawling riga.lv News section...');
    const baseUrl = 'https://www.riga.lv';
    const newsUrl = 'https://www.riga.lv/lv/jaunumi';

    const html = await fetchHtml(newsUrl);
    if (!html) return;

    const $ = cheerio.load(html);
    const articles = [];

    // Select news items
    $('a[href*="/lv/jaunumi/"]').each((i, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim();
        if (href && title && title.length > 20) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!articles.find(a => a.url === fullUrl)) {
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
        await sleep(1000);
        const articleHtml = await fetchHtml(article.url);
        if (articleHtml) {
            const $a = cheerio.load(articleHtml);
            let content = $a('article').text().trim() || $a('.field--name-body').text().trim() || $a('main').text().trim();
            content = content.replace(/\s+/g, ' ');

            const fileContent = `Title: ${article.title}\nURL: ${article.url}\nDate: ${new Date().toISOString()}\n\n${content}`;

            fs.writeFileSync(destPath, fileContent, 'utf8');
            console.log(`    ✓ Saved (${(fileContent.length / 1024).toFixed(1)} KB)`);
        }
    }
}

if (!fs.existsSync(SCRAPED_DIR)) {
    fs.mkdirSync(SCRAPED_DIR, { recursive: true });
}

crawlNews().catch(console.error);
