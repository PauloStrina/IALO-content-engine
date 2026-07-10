import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'index.html');
const outDir = path.resolve(process.cwd(), 'dist/ialo_acceptance_test_v03_assets_free');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await page.goto(`file://${htmlPath}`);

for (let i = 1; i <= 10; i++) {
  const selector = `.slide[data-slide="${i}"]`;
  const element = await page.locator(selector).first();
  await element.screenshot({ path: path.join(outDir, `ialo_acceptance_test_v03_slide_${String(i).padStart(2, '0')}.png`) });
}

await page.setViewportSize({ width: 1200, height: 1500 });
const contact = await page.locator('#contact-sheet').first();
await contact.screenshot({ path: path.join(outDir, 'ialo_acceptance_test_v03_contact_sheet.png') });

await browser.close();
console.log(`Rendered PNGs to ${outDir}`);
