import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates/ialo.assets.json'), 'utf8'));

const thesisId = '01_acceptance_inner_dialogue';
const thesis = registry.backgrounds_by_thesis[thesisId];
const bgRoot = thesis.folder;
const outRoot = path.join(repoRoot, 'dist/ialo_acceptance_approval_pack');

fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });

const versions = [
  {
    id: 'v01_cinematic_sober',
    label: 'V01 · Cinematic sober',
    description: 'Versión base aprobable: profunda, atmosférica, cinematográfica, con variación editorial controlada.',
    mode: 'cinematic'
  },
  {
    id: 'v02_minimal_constant_text',
    label: 'V02 · Minimal constant text',
    description: 'Nueva versión minimalista: fondo real + velo oscuro leve + texto siempre en el mismo lugar para lectura predecible.',
    mode: 'minimal'
  }
];

const slideData = [
  { n: 1, role: 'cold_open', layout: 'cover', bg: 'Lluvia 1.jpg', text: '¿CUÁNTA ENERGÍA\nESTÁS GASTANDO\nEN PELEAR\nCON LO QUE\nYA ES?' },
  { n: 2, role: 'pause', layout: 'pause', bg: 'Ventana 1.jpg', text: 'A veces no duele solamente lo que pasa.', supporting: 'Duele la pelea interna\ncontra lo que pasa.' },
  { n: 3, role: 'resistance', layout: 'quote', bg: 'Pieza 2.jpg', text: '“Esto no debería estar pasando.”\n\n“Yo ya tendría que estar en otro lugar.”\n\n“No debería sentir esto.”' },
  { n: 4, role: 'cost', layout: 'split', bg: 'Silla Libro 1.jpg', text: 'Esa pelea interna también cansa.', supporting: 'A veces la confundimos con acción.\nPero muchas veces es resistencia usando otro nombre.' },
  { n: 5, role: 'invisible_cost', layout: 'poetic', bg: 'Lluvia 2.jpg', text: 'Lo que no podés mirar\nsuele empezar a manejarte\nen silencio.' },
  { n: 6, role: 'reframe', layout: 'reframe', bg: 'Pieza 1.jpg', text: 'Aceptar no es rendirse.', supporting: 'Es dejar de discutir con la realidad\npara poder responder mejor.' },
  { n: 7, role: 'distinction', layout: 'distinction', bg: 'Pieza 4.jpg', text: 'No es resignación.\nEs presencia.', supporting: 'Resignarse apaga.\nAceptar ordena.' },
  { n: 8, role: 'integration', layout: 'center', bg: 'Silla Libro 2.jpg', text: 'Porque lo que es,\nprimero se mira.\n\nDespués se transforma.' },
  { n: 9, role: 'question', layout: 'question', bg: 'Ventana 1.jpg', text: '¿Qué estás resistiendo que, si pudieras mirar de frente, empezaría a transformarse?' },
  { n: 10, role: 'closing', layout: 'closing', bg: 'Lluvia 1.jpg', text: 'Lo visible es consecuencia.\nLo invisible es causa.', supporting: 'Guardalo para volver a esta pregunta cuando vuelvas a pelear con lo que es.' }
];

const requiredAssets = [
  registry.logo,
  registry.fonts.futura_condensed_extra_bold,
  registry.fonts.gotham_narrow_medium,
  registry.fonts.lyon_text_regular,
  registry.fonts.lyon_display_regular,
  ...slideData.map((slide) => path.join(bgRoot, slide.bg))
];

const missing = requiredAssets.filter((assetPath) => !fs.existsSync(path.join(repoRoot, assetPath)));
if (missing.length) {
  console.error('Missing required IALO assets:');
  for (const asset of missing) console.error(`- ${asset}`);
  process.exit(1);
}

console.log('Rendering IALO approval pack: V01 cinematic + V02 minimal constant text');
for (const slide of slideData) console.log(`slide ${slide.n}: ${path.join(bgRoot, slide.bg)}`);
console.log(`logo: ${registry.logo}`);

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function br(value = '') {
  return esc(value).replaceAll('\n', '<br>');
}

function fileToDataUri(absPath, mime) {
  return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`;
}

async function fontDataUri(repoRelativePath) {
  return fileToDataUri(path.join(repoRoot, repoRelativePath), 'font/woff');
}

const fontCss = `
@font-face{font-family:IALOFutura;src:url("${await fontDataUri(registry.fonts.futura_condensed_extra_bold)}") format('woff');font-weight:900;font-style:normal;font-display:block;}
@font-face{font-family:IALOGothamNarrow;src:url("${await fontDataUri(registry.fonts.gotham_narrow_medium)}") format('woff');font-weight:500;font-style:normal;font-display:block;}
@font-face{font-family:IALOLyonText;src:url("${await fontDataUri(registry.fonts.lyon_text_regular)}") format('woff');font-weight:400;font-style:normal;font-display:block;}
@font-face{font-family:IALOLyonDisplay;src:url("${await fontDataUri(registry.fonts.lyon_display_regular)}") format('woff');font-weight:400;font-style:normal;font-display:block;}
`;

const assetCache = new Map();

async function backgroundDataUri(repoRelativePath) {
  if (assetCache.has(repoRelativePath)) return assetCache.get(repoRelativePath);
  const abs = path.join(repoRoot, repoRelativePath);
  const buffer = await sharp(abs)
    .rotate()
    .resize({ width: 1080, height: 1350, fit: 'cover', position: 'center' })
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();
  const uri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  assetCache.set(repoRelativePath, uri);
  return uri;
}

async function logoDataUri() {
  const abs = path.join(repoRoot, registry.logo);
  const buffer = await sharp(abs)
    .rotate()
    .resize({ width: 220, withoutEnlargement: true })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const logoUri = await logoDataUri();
for (const slide of slideData) {
  slide.bgPath = path.join(bgRoot, slide.bg);
  slide.bgUri = await backgroundDataUri(slide.bgPath);
}

const baseCss = `
:root{--cream:#EEE9E0;--black:#1A1A1A;--orange:#FF5000;--w:1080px;--h:1350px;}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#111;color:var(--cream);font-family:IALOLyonText,Georgia,serif;}
body.render{width:var(--w);height:var(--h);overflow:hidden;}
.slide{width:var(--w);height:var(--h);position:relative;overflow:hidden;background:#111;color:var(--cream);}
.bg-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;}
.veil{position:absolute;inset:0;z-index:2;pointer-events:none;}
.counter{position:absolute;z-index:40;font-family:IALOFutura,Impact,'Arial Narrow',sans-serif;font-weight:900;}
.logo-img{position:absolute;left:76px;bottom:68px;width:76px;height:auto;z-index:42;object-fit:contain;filter:brightness(0) invert(1);opacity:.95;}
.accent{position:absolute;z-index:35;background:var(--orange);width:88px;height:9px}.shadow{text-shadow:4px 5px 0 rgba(0,0,0,.30)}
.text,.support,.quote{position:absolute;z-index:34}.text{font-family:IALOLyonDisplay,Georgia,serif}.support{font-family:IALOLyonText,Georgia,serif}.futura{font-family:IALOFutura,Impact,'Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:-.025em}.card{position:absolute;z-index:28}.panel{position:absolute;z-index:27}

/* V01 — cinematic sober */
.v01 .bg-img{filter:saturate(.70) contrast(1.12) brightness(.78)}
.v01 .veil{background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.38) 68%,rgba(0,0,0,.62)),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.54))}
.v01 .counter{left:76px;top:68px;background:transparent;border:1px solid rgba(238,233,224,.42);border-radius:36px;padding:13px 23px 10px;font-size:28px;line-height:1;color:var(--cream)}
.v01 .layout-cover .text{left:72px;top:310px;width:840px;font:400 78px/1.02 IALOLyonDisplay,Georgia,serif;letter-spacing:-.02em}.v01 .layout-cover .accent{left:76px;top:910px;width:58px;height:7px}
.v01 .layout-pause .text{left:98px;top:315px;width:820px;font:66px/1.04 IALOLyonDisplay,Georgia,serif}.v01 .layout-pause .support{left:98px;top:620px;width:790px;font:44px/1.12 IALOLyonText,Georgia,serif}.v01 .layout-pause .accent{left:98px;top:555px;width:55px}
.v01 .layout-quote .card{left:98px;top:200px;width:780px;min-height:815px;border-radius:18px;background:rgba(26,26,26,.70);border:1px solid rgba(238,233,224,.28);padding:105px 54px;color:var(--cream)}.v01 .layout-quote .bar{position:absolute;z-index:36;left:98px;top:200px;width:8px;height:815px;background:var(--orange)}.v01 .layout-quote .quote{position:relative;font:54px/1.08 IALOLyonDisplay,Georgia,serif;white-space:pre-line;color:var(--cream)}
.v01 .layout-split .panel{left:0;top:0;width:100%;height:100%;background:rgba(26,26,26,.72)}.v01 .layout-split .text{left:70px;top:255px;width:780px;font:66px/1 IALOLyonDisplay,Georgia,serif}.v01 .layout-split .support{left:70px;top:700px;width:760px;font:42px/1.12 IALOLyonText,Georgia,serif}.v01 .layout-split .accent{left:70px;top:610px;width:80px}
.v01 .layout-poetic .text{left:98px;top:390px;width:820px;font:66px/1.04 IALOLyonDisplay,Georgia,serif}.v01 .layout-poetic .line{position:absolute;z-index:34;left:98px;top:1085px;width:394px;height:2px;background:rgba(238,233,224,.8)}
.v01 .layout-reframe .card{left:72px;top:270px;width:868px;height:545px;border-radius:22px;background:rgba(26,26,26,.72);border:1px solid rgba(238,233,224,.26);color:var(--cream);padding:110px 36px}.v01 .layout-reframe .accent{left:108px;top:320px}.v01 .layout-reframe .text{position:relative;left:auto;top:auto;width:auto;font:78px/1 IALOLyonDisplay,Georgia,serif;color:var(--cream);margin:0 0 62px}.v01 .layout-reframe .support{position:relative;left:auto;top:auto;width:760px;font:46px/1.11 IALOLyonText,Georgia,serif;color:var(--cream)}
.v01 .layout-distinction .top{position:absolute;z-index:27;left:0;top:0;width:100%;height:355px;background:rgba(26,26,26,.72);border-bottom:1px solid rgba(238,233,224,.2)}.v01 .layout-distinction .text{left:76px;top:92px;width:860px;font:76px/.98 IALOLyonDisplay,Georgia,serif;color:var(--cream)}.v01 .layout-distinction .mini{position:absolute;z-index:28;left:76px;top:785px;width:664px;height:225px;border-radius:18px;background:rgba(26,26,26,.72);border:1px solid rgba(238,233,224,.26);padding:90px 34px 0}.v01 .layout-distinction .support{position:relative;left:auto;top:auto;width:auto;font:48px/1.1 IALOLyonText,Georgia,serif;color:var(--cream)}.v01 .layout-distinction .accent{left:110px;top:835px;width:62px}
.v01 .layout-center .text{left:145px;top:360px;width:790px;text-align:center;font:76px/1 IALOLyonDisplay,Georgia,serif}.v01 .layout-question .accent{left:76px;top:260px;width:72px}.v01 .layout-question .text{left:98px;top:340px;width:820px;font:66px/1.04 IALOLyonDisplay,Georgia,serif}.v01.layout-closing .bg-img{height:100%;top:0}.v01.layout-closing .text{left:76px;top:300px;width:870px;font:78px/1.02 IALOLyonDisplay,Georgia,serif;color:var(--cream)}.v01.layout-closing .support{left:76px;top:665px;width:780px;font:40px/1.12 IALOLyonText,Georgia,serif;color:var(--cream)}.v01.layout-closing .accent{left:76px;top:600px;width:76px}

/* V02 — minimal constant text: same copy coordinates on every slide */
.v02 .bg-img{filter:saturate(.76) contrast(1.08) brightness(.74)}
.v02 .veil{background:rgba(0,0,0,.28)}
.v02 .accent{left:0;top:0;width:92px;height:9px}
.v02 .counter{left:76px;top:82px;border:1px solid rgba(238,233,224,.50);border-radius:36px;padding:13px 23px 10px;font-size:32px;line-height:1;color:var(--cream);background:rgba(26,26,26,.38)}
.v02 .text{left:76px;top:330px;width:850px;font:70px/1.02 IALOLyonDisplay,Georgia,serif;letter-spacing:-.018em;color:var(--cream)}
.v02 .text.futura{font-family:IALOFutura,Impact,'Arial Narrow',sans-serif;font-size:88px;line-height:.80;letter-spacing:-.028em;text-transform:uppercase}
.v02 .support{left:76px;top:665px;width:805px;font:42px/1.12 IALOLyonText,Georgia,serif;color:var(--cream)}
.v02 .quote{font:70px/1.02 IALOLyonDisplay,Georgia,serif;color:var(--cream)}
.v02 .logo-img{left:76px;bottom:70px;width:72px;opacity:.96}

.contact{background:#EEE9E0;color:#1A1A1A;padding:36px;font-family:IALOGothamNarrow,Arial,sans-serif;}
.contact h1{font:500 38px/1 IALOGothamNarrow,Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;margin:0 0 12px;}
.contact p{font:500 22px/1.2 IALOGothamNarrow,Arial,sans-serif;margin:0 0 28px;color:#555;}
.contact-grid{display:grid;grid-template-columns:repeat(5,270px);gap:34px 28px;align-items:start;}
.thumb{width:270px;height:337.5px;object-fit:cover;box-shadow:0 10px 30px rgba(0,0,0,.18);background:#111;display:block;}
.cap{font:500 16px/1 IALOGothamNarrow,Arial,sans-serif;margin-top:8px;color:#1A1A1A;text-transform:uppercase;}
.master-grid{display:grid;grid-template-columns:repeat(10,172px);gap:14px;align-items:start;}
.master-label{grid-column:1/-1;font:500 28px/1 IALOGothamNarrow,Arial,sans-serif;text-transform:uppercase;margin:24px 0 4px;color:#1A1A1A;}
.master-thumb{width:172px;height:215px;object-fit:cover;box-shadow:0 6px 18px rgba(0,0,0,.16);background:#111;display:block;}
`;

function slideShell(slide, version, innerHtml) {
  return `
    <article class="slide ${version.mode === 'cinematic' ? 'v01' : 'v02'} layout-${slide.layout}" data-slide="${slide.n}">
      <img class="bg-img" src="${slide.bgUri}" alt="${esc(slide.bgPath)}" />
      <div class="veil"></div>
      ${innerHtml}
      <img class="logo-img" src="${logoUri}" alt="IALO" />
    </article>`;
}

function cinematicSlideHtml(slide, version) {
  const counterClass = 'counter';
  const shared = `
    <div class="${counterClass}">${slide.n}/10</div>
    ${slide.layout === 'quote' ? '<div class="bar"></div>' : ''}
    ${slide.layout === 'split' ? '<div class="panel"></div>' : ''}
    ${slide.layout === 'distinction' ? '<div class="top"></div><div class="mini"><div class="support">' + br(slide.supporting) + '</div></div>' : ''}
    ${slide.layout === 'quote'
      ? `<div class="card"><div class="quote">${br(slide.text)}</div></div>`
      : slide.layout === 'reframe'
        ? `<div class="card"><div class="text">${br(slide.text)}</div><div class="support">${br(slide.supporting)}</div></div>`
        : `<div class="text ${slide.layout === 'cover' ? '' : 'shadow'}">${br(slide.text)}</div>`}
    ${slide.supporting && !['reframe', 'distinction'].includes(slide.layout) ? `<div class="support">${br(slide.supporting)}</div>` : ''}
    ${slide.layout === 'poetic' ? '<div class="line"></div>' : ''}
    <div class="accent"></div>`;
  return slideShell(slide, version, shared);
}

function minimalSlideHtml(slide, version) {
  const support = slide.supporting ? `<div class="support">${br(slide.supporting)}</div>` : '';
  const mainClass = slide.layout === 'cover' ? 'text futura shadow' : 'text shadow';
  return slideShell(slide, version, `
    <div class="accent"></div>
    <div class="counter">${slide.n}/10</div>
    <div class="${mainClass}">${br(slide.text)}</div>
    ${support}`);
}

function slideHtml(slide, version) {
  return version.mode === 'cinematic' ? cinematicSlideHtml(slide, version) : minimalSlideHtml(slide, version);
}

function slideDocument(version, slide) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="render">${slideHtml(slide, version)}</body></html>`;
}

function imageFileToDataUri(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'image/png';
  return fileToDataUri(absPath, mime);
}

function contactSheetHtml(version, versionDir) {
  const items = slideData.map((slide) => {
    const file = path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`);
    return `<div><img class="thumb" src="${imageFileToDataUri(file)}" /><div class="cap">${String(slide.n).padStart(2, '0')} · ${esc(slide.role)} · ${esc(slide.bg)}</div></div>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact"><h1>${esc(version.label)}</h1><p>${esc(version.description)} · Real assets · 1080×1350 PNGs</p><main class="contact-grid">${items}</main></body></html>`;
}

function masterHtml() {
  const rows = versions.map((version) => {
    const versionDir = path.join(outRoot, version.id);
    const thumbs = slideData.map((slide) => `<img class="master-thumb" src="${imageFileToDataUri(path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`))}" />`).join('\n');
    return `<div class="master-label">${esc(version.label)}</div>${thumbs}`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact"><h1>IALO · approval pack · V01 + V02 minimal</h1><p>Elegir una sola versión para publicar en Blotato. V02 mantiene texto fijo en todas las placas.</p><main class="master-grid">${rows}</main></body></html>`;
}

async function waitForPage(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(document.images || []);
    await Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })));
    const broken = images.filter((img) => !img.naturalWidth || !img.naturalHeight).map((img) => img.getAttribute('alt') || img.getAttribute('src'));
    if (broken.length) throw new Error(`Broken embedded image assets: ${broken.join(', ')}`);
  });
}

const manifest = {
  content_id: 'ialo_acceptance_inner_dialogue_approval_pack_v01_v02_minimal',
  thesis_id: thesisId,
  thesis: thesis.label,
  output_status: 'pending_human_approval',
  publication_target: 'blotato',
  publication_rule: 'Render both versions. Human chooses exactly one approved version. Only the approved version should be sent to Blotato.',
  render_quality: 'real_assets_high_fidelity_embedded_data_uri',
  versions: versions.map((version) => ({
    id: version.id,
    label: version.label,
    description: version.description,
    folder: `${version.id}/`,
    contact_sheet: `${version.id}/contact_sheet.png`,
    approved_for_publication: false
  })),
  slides: slideData.map(({ n, role, layout, bg, bgPath, text, supporting }) => ({
    n,
    role,
    layout,
    background: bgPath,
    text,
    supporting
  }))
};
fs.writeFileSync(path.join(outRoot, 'approval_manifest.json'), JSON.stringify(manifest, null, 2));

const browser = await chromium.launch({ headless: true });

for (const version of versions) {
  const versionDir = path.join(outRoot, version.id);
  fs.mkdirSync(versionDir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const slide of slideData) {
    await page.setContent(slideDocument(version, slide), { waitUntil: 'load' });
    await waitForPage(page);
    await page.locator('.slide').first().screenshot({ path: path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`) });
  }
  await page.close();

  const contact = await browser.newPage({ viewport: { width: 1600, height: 1120 }, deviceScaleFactor: 1 });
  await contact.setContent(contactSheetHtml(version, versionDir), { waitUntil: 'load' });
  await waitForPage(contact);
  await contact.locator('body').screenshot({ path: path.join(versionDir, 'contact_sheet.png') });
  await contact.close();
}

const master = await browser.newPage({ viewport: { width: 1980, height: 780 }, deviceScaleFactor: 1 });
await master.setContent(masterHtml(), { waitUntil: 'load' });
await waitForPage(master);
await master.locator('body').screenshot({ path: path.join(outRoot, 'approval_contact_sheet_all_versions.png') });
await master.close();

await browser.close();
console.log(`Rendered V01 + V02 minimal approval pack to ${outRoot}`);
