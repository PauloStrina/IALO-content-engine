import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const campaignId = process.env.CAMPAIGN_ID || "2026-07-14-eight-weeks";
const outputRoot = process.env.CAMPAIGN_OUTPUT_DIR || `public-assets/campaigns/${campaignId}`;
const index = JSON.parse(await fs.readFile(path.join(outputRoot, "campaign-index.json"), "utf8"));
const tmpDir = path.join(outputRoot, "_contact_tmp");
await fs.mkdir(tmpDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1260, height: 900 }, deviceScaleFactor: 1 });
const overviewItems = [];

for (const item of index.items) {
  const dir = path.join(outputRoot, item.content_id);
  const metadata = JSON.parse(await fs.readFile(path.join(dir, "metadata.json"), "utf8"));
  const slides = (await fs.readdir(dir)).filter((name) => /^slide-\d+\.png$/.test(name)).sort();
  const cards = slides.map((name, i) => `<figure><img src="${pathToFileURL(path.join(dir, name)).href}"><figcaption>${String(i + 1).padStart(2, "0")}</figcaption></figure>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:34px;background:#EEE9E0;color:#1A1A1A;font-family:Arial,sans-serif}h1{margin:0 0 8px;font-size:30px}p{margin:0 0 28px;font-size:18px;color:#5d574f}.grid{display:grid;grid-template-columns:repeat(4,270px);gap:24px}figure{margin:0}img{display:block;width:270px;height:338px;object-fit:cover;box-shadow:0 8px 28px rgba(0,0,0,.18)}figcaption{padding-top:7px;font-weight:700;font-size:15px}</style></head><body><h1>Semana ${metadata.week} · ${metadata.variant} · ${metadata.title}</h1><p>${metadata.publish_at} · ${metadata.thesis_id}</p><div class="grid">${cards}</div></body></html>`;
  const htmlPath = path.join(tmpDir, `${item.content_id}.html`);
  await fs.writeFile(htmlPath, html);
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(async () => Promise.all([...document.images].map((img) => img.decode())));
  const outPath = path.join(dir, "contact-sheet.png");
  await page.screenshot({ path: outPath, fullPage: true });
  overviewItems.push({ ...item, title: metadata.title, contact: outPath });
}

const overviewCards = overviewItems.map((item) => `<figure><img src="${pathToFileURL(item.contact).href}"><figcaption>Semana ${item.week}${item.variant} · ${item.title}</figcaption></figure>`).join("");
const overviewHtml = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:36px;background:#EEE9E0;color:#1A1A1A;font-family:Arial,sans-serif}h1{margin:0 0 30px;font-size:34px}.grid{display:grid;grid-template-columns:repeat(4,270px);gap:26px}figure{margin:0}img{display:block;width:270px;height:338px;object-fit:cover;object-position:top;box-shadow:0 8px 28px rgba(0,0,0,.18)}figcaption{padding-top:9px;font-weight:700;font-size:15px;line-height:1.2}</style></head><body><h1>IALO · campaña 8 semanas · 16 carruseles</h1><div class="grid">${overviewCards}</div></body></html>`;
const overviewPath = path.join(tmpDir, "overview.html");
await fs.writeFile(overviewPath, overviewHtml);
await page.goto(pathToFileURL(overviewPath).href);
await page.evaluate(async () => Promise.all([...document.images].map((img) => img.decode())));
await page.screenshot({ path: path.join(outputRoot, "campaign-contact-sheet.png"), fullPage: true });

await browser.close();
await fs.rm(tmpDir, { recursive: true, force: true });
console.log(`Contact sheets generated for ${overviewItems.length} carousels`);
