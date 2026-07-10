import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const htmlPath = path.join(__dirname, 'index.html');
const outDir = path.resolve(process.cwd(), 'dist/ialo_acceptance_test_v03_real_assets');

const requiredAssets = [
  'assets/ialo/logos/ojo ialo png.png',
  'assets/ialo/fonts/AnyConv.com__FuturaStd-CondensedExtraBd.woff',
  'assets/ialo/fonts/AnyConv.com__GothamNarrow-Medium.woff',
  'assets/ialo/fonts/AnyConv.com__Lyon Text-Regular.woff',
  'assets/ialo/fonts/AnyConv.com__LyonDisplay-Regular.woff',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Lluvia 1.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Lluvia 2.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Pieza 1.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Pieza 2.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Pieza 4.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Silla Libro 1.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Silla Libro 2.jpg',
  'assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Ventana 1.jpg'
];

const missing = requiredAssets.filter((assetPath) => !fs.existsSync(path.join(repoRoot, assetPath)));
if (missing.length) {
  console.error('Missing required IALO assets:');
  for (const asset of missing) console.error(`- ${asset}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await page.goto(`file://${htmlPath}`);
await page.evaluate(async () => {
  if (document.fonts?.ready) await document.fonts.ready;
  const images = Array.from(document.images || []);
  await Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  })));
});

for (let i = 1; i <= 10; i++) {
  const selector = `.slide[data-slide="${i}"]`;
  const element = await page.locator(selector).first();
  await element.screenshot({ path: path.join(outDir, `ialo_acceptance_test_v03_slide_${String(i).padStart(2, '0')}.png`) });
}

const contact = await page.locator('#contact-sheet').first();
await contact.screenshot({ path: path.join(outDir, 'ialo_acceptance_test_v03_contact_sheet.png') });

await browser.close();
console.log(`Rendered real-assets PNGs to ${outDir}`);
