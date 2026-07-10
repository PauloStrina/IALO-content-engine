import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates/ialo.assets.json'), 'utf8'));

const contentFile = process.env.CONTENT_FILE || 'content/examples/01_acceptance_inner_dialogue/problema_conexion.acceptance.json';
const contentPath = path.resolve(repoRoot, contentFile);

if (!fs.existsSync(contentPath)) {
  console.error(`CONTENT_FILE not found: ${contentFile}`);
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const thesisId = content.thesis_id;
const thesis = registry.backgrounds_by_thesis[thesisId];

if (!thesis) {
  console.error(`Unknown thesis_id: ${thesisId}`);
  process.exit(1);
}

const bgRoot = thesis.folder;
const outRoot = path.join(repoRoot, 'dist/ialo_content_approval_pack');
const tmpRoot = path.join(repoRoot, 'dist/_ialo_tmp_normalized_assets');

fs.rmSync(outRoot, { recursive: true, force: true });
fs.rmSync(tmpRoot, { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });
fs.mkdirSync(tmpRoot, { recursive: true });

const versions = [
  {
    id: 'v01_cinematic_sober',
    label: 'V01 · Cinematic sober',
    description: 'Versión 1 bloqueada: mantiene el diseño cinematográfico aprobado, sin rearmar layouts.',
    className: 'v01'
  },
  {
    id: 'v02_minimal_constant_text',
    label: 'V02 · Minimal constant text',
    description: 'Versión minimalista: fondos reales más oscuros, velo constante y texto siempre en el mismo lugar.',
    className: 'v02'
  }
];

function sanitizeFileName(value = 'ialo-content') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function inferLayout(slide, index, total) {
  if (slide.layout) return slide.layout;
  const role = String(slide.role || '').toLowerCase();
  if (index === 0) return 'cover';
  if (index === total - 1) return 'closing';
  if (role.includes('quote') || role.includes('resistance')) return 'quote';
  if (role.includes('distinction')) return 'distinction';
  if (role.includes('reframe')) return 'reframe';
  if (role.includes('question')) return 'question';
  if (role.includes('integration') || role.includes('center')) return 'center';
  if (role.includes('cost') && slide.supporting_text) return 'split';
  return 'poetic';
}

function normalizeSlides(rawSlides = []) {
  if (!Array.isArray(rawSlides) || rawSlides.length === 0) {
    console.error('Content file must include at least one slide in slides[].');
    process.exit(1);
  }

  const total = rawSlides.length;
  return rawSlides.map((slide, index) => {
    const text = slide.text;
    if (!text || typeof text !== 'string') {
      console.error(`Slide ${index + 1} is missing required text.`);
      process.exit(1);
    }

    const background = slide.background || thesis.images[index % thesis.images.length];
    return {
      n: index + 1,
      originalNumber: slide.number || index + 1,
      role: slide.role || (index === 0 ? 'hook' : index === total - 1 ? 'closing' : 'body'),
      layout: inferLayout(slide, index, total),
      bg: background,
      pos: slide.position || 'center center',
      text,
      supporting: slide.supporting_text || slide.supporting || ''
    };
  });
}

const slideData = normalizeSlides(content.slides);
const totalSlides = slideData.length;

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

console.log('Rendering IALO approval pack from manual content input');
console.log(`content_file: ${contentFile}`);
console.log(`content_id: ${content.content_id}`);
console.log(`thesis: ${thesisId} · ${thesis.label}`);
console.log(`slides: ${totalSlides}`);
for (const slide of slideData) console.log(`slide ${slide.n}/${totalSlides}: ${path.join(bgRoot, slide.bg)} · ${slide.layout}`);
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

function fontDataUri(repoRelativePath) {
  return fileToDataUri(path.join(repoRoot, repoRelativePath), 'font/woff');
}

function pngDataUri(absPath) {
  return fileToDataUri(absPath, 'image/png');
}

function jpgDataUri(absPath) {
  return fileToDataUri(absPath, 'image/jpeg');
}

async function normalizeBackground(srcRepoPath, key) {
  const src = path.join(repoRoot, srcRepoPath);
  const out = path.join(tmpRoot, `${key}.jpg`);
  await sharp(src, { failOn: 'none' })
    .rotate()
    .resize({ width: 1080, height: 1350, fit: 'cover', position: 'center' })
    .toColorspace('srgb')
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(out);
  return jpgDataUri(out);
}

async function normalizeLogo(srcRepoPath) {
  const src = path.join(repoRoot, srcRepoPath);
  const out = path.join(tmpRoot, 'logo.png');
  await sharp(src, { failOn: 'none' })
    .rotate()
    .resize({ width: 280, withoutEnlargement: true })
    .toColorspace('srgb')
    .png()
    .toFile(out);
  return pngDataUri(out);
}

const uniqueBgNames = [...new Set(slideData.map((slide) => slide.bg))];
const bgDataUris = new Map();
let bgIndex = 1;
for (const bgName of uniqueBgNames) {
  const repoPath = path.join(bgRoot, bgName);
  bgDataUris.set(bgName, await normalizeBackground(repoPath, `bg_${String(bgIndex).padStart(2, '0')}`));
  bgIndex += 1;
}
const logoDataUri = await normalizeLogo(registry.logo);

const fontCss = `
@font-face{font-family:IALOFutura;src:url("${fontDataUri(registry.fonts.futura_condensed_extra_bold)}") format('woff');font-weight:900;font-style:normal;font-display:block;}
@font-face{font-family:IALOGothamNarrow;src:url("${fontDataUri(registry.fonts.gotham_narrow_medium)}") format('woff');font-weight:500;font-style:normal;font-display:block;}
@font-face{font-family:IALOLyonText;src:url("${fontDataUri(registry.fonts.lyon_text_regular)}") format('woff');font-weight:400;font-style:normal;font-display:block;}
@font-face{font-family:IALOLyonDisplay;src:url("${fontDataUri(registry.fonts.lyon_display_regular)}") format('woff');font-weight:400;font-style:normal;font-display:block;}
`;

const baseCss = `
:root{--cream:#EEE9E0;--black:#1A1A1A;--orange:#FF5000;--w:1080px;--h:1350px;}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#111;color:var(--cream);font-family:IALOLyonText,Georgia,serif;}
body.render{width:var(--w);height:var(--h);overflow:hidden;}
.slide{width:var(--w);height:var(--h);position:relative;overflow:hidden;background:#111;color:var(--cream);}
.bg-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--pos,center center);z-index:1;}
.veil{position:absolute;inset:0;z-index:2;pointer-events:none;}
.counter{position:absolute;right:76px;top:68px;z-index:40;border-radius:36px;padding:13px 23px 10px;font:900 32px/1 IALOFutura,Impact,sans-serif;background:rgba(26,26,26,.72);color:var(--cream)}
.counter.light{background:rgba(238,233,224,.92);color:var(--black)}
.logo-img{position:absolute;left:76px;bottom:68px;width:76px;height:auto;z-index:42;object-fit:contain;}
.logo-img.white{filter:brightness(0) invert(1);opacity:.95}.logo-img.black{filter:brightness(0);opacity:.92}
.accent{position:absolute;z-index:35;background:var(--orange);width:88px;height:9px}.shadow{text-shadow:4px 5px 0 rgba(0,0,0,.30)}
.text,.support,.quote{position:absolute;z-index:34}.text{font-family:IALOLyonDisplay,Georgia,serif}.support{font-family:IALOLyonText,Georgia,serif}.futura{font-family:IALOFutura,Impact,'Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:-.025em}.card{position:absolute;z-index:28}.panel{position:absolute;z-index:27}

/* V01 locked: cinematic approved layout family */
.layout-cover .text{left:72px;top:240px;width:875px;font:900 106px/.77 IALOFutura,Impact,sans-serif}.layout-cover .accent{left:76px;top:980px}
.layout-pause .text{left:86px;top:315px;width:820px;font:64px/1.02 IALOLyonDisplay,Georgia,serif}.layout-pause .support{left:86px;top:650px;width:790px;font:50px/1.1 IALOLyonText,Georgia,serif}.layout-pause .accent{left:86px;top:555px;width:55px}
.layout-quote .card{left:92px;top:200px;width:788px;min-height:815px;border-radius:18px;background:rgba(238,233,224,.96);color:var(--black);padding:105px 54px}.layout-quote .bar{position:absolute;z-index:36;left:92px;top:200px;width:20px;height:815px;background:var(--orange)}.layout-quote .quote{position:relative;font:58px/1.08 IALOLyonDisplay,Georgia,serif;white-space:pre-line;color:var(--black)}
.layout-split .panel{left:0;top:0;width:530px;height:100%;background:var(--black)}.layout-split .text{left:70px;top:255px;width:425px;font:74px/1 IALOLyonDisplay,Georgia,serif}.layout-split .support{left:70px;top:700px;width:395px;font:42px/1.12 IALOLyonText,Georgia,serif}.layout-split .accent{left:70px;top:610px;width:80px}
.layout-poetic .text{left:76px;top:390px;width:860px;font:76px/1 IALOLyonDisplay,Georgia,serif}.layout-poetic .line{position:absolute;z-index:34;left:76px;top:1085px;width:394px;height:2px;background:rgba(238,233,224,.8)}
.layout-reframe .card{left:72px;top:270px;width:868px;height:545px;border-radius:22px;background:rgba(238,233,224,.94);color:var(--black);padding:110px 36px}.layout-reframe .accent{left:108px;top:320px}.layout-reframe .text{position:relative;left:auto;top:auto;width:auto;font:78px/1 IALOLyonDisplay,Georgia,serif;color:var(--black);margin:0 0 62px}.layout-reframe .support{position:relative;left:auto;top:auto;width:760px;font:46px/1.11 IALOLyonText,Georgia,serif;color:var(--black)}
.layout-distinction .top{position:absolute;z-index:27;left:0;top:0;width:100%;height:355px;background:var(--cream);color:var(--black)}.layout-distinction .text{left:76px;top:92px;width:860px;font:76px/.98 IALOLyonDisplay,Georgia,serif;color:var(--black)}.layout-distinction .mini{position:absolute;z-index:28;left:76px;top:785px;width:664px;height:225px;border-radius:18px;background:rgba(26,26,26,.92);padding:90px 34px 0}.layout-distinction .support{position:relative;left:auto;top:auto;width:auto;font:48px/1.1 IALOLyonText,Georgia,serif}.layout-distinction .accent{left:110px;top:835px;width:62px}
.layout-center .text{left:145px;top:360px;width:790px;text-align:center;font:82px/1 IALOLyonDisplay,Georgia,serif}.layout-question .accent{left:76px;top:260px;width:72px}.layout-question .text{left:76px;top:340px;width:830px;font:70px/1.02 IALOLyonDisplay,Georgia,serif}.layout-closing{background:var(--cream);color:var(--black)}.layout-closing .bg-img{top:auto;height:530px;bottom:0}.layout-closing .text{left:76px;top:270px;width:870px;font:78px/1.02 IALOLyonDisplay,Georgia,serif;color:var(--black)}.layout-closing .support{left:76px;top:635px;width:780px;font:40px/1.12 IALOLyonText,Georgia,serif;color:var(--black)}.layout-closing .accent{left:76px;top:570px;width:76px}
.v01 .bg-img{filter:saturate(.70) contrast(1.12) brightness(.78)}
.v01 .veil{background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.38) 68%,rgba(0,0,0,.62)),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.54))}

/* V02 minimal: fixed text coordinates + darker background for legibility */
.v02 .bg-img{filter:saturate(.68) contrast(1.12) brightness(.55)}
.v02 .veil{background:linear-gradient(90deg,rgba(0,0,0,.66),rgba(0,0,0,.50) 62%,rgba(0,0,0,.62)),linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.46))}
.v02 .accent{left:0;top:0;width:92px;height:9px}
.v02 .counter{left:76px;right:auto;top:82px;border:1px solid rgba(238,233,224,.50);border-radius:36px;padding:13px 23px 10px;font:900 32px/1 IALOFutura,Impact,sans-serif;color:var(--cream);background:rgba(26,26,26,.45)}
.v02 .text{left:76px!important;top:330px!important;width:850px!important;text-align:left!important;font:70px/1.02 IALOLyonDisplay,Georgia,serif!important;letter-spacing:-.018em;color:var(--cream)!important;text-transform:none!important}
.v02 .text.futura{font-family:IALOFutura,Impact,'Arial Narrow',sans-serif!important;font-size:88px!important;line-height:.80!important;letter-spacing:-.028em!important;text-transform:uppercase!important}
.v02 .support{left:76px!important;top:665px!important;width:805px!important;font:42px/1.12 IALOLyonText,Georgia,serif!important;color:var(--cream)!important}
.v02 .logo-img{left:76px;bottom:70px;width:72px;opacity:.96;filter:brightness(0) invert(1)}

.contact{background:#EEE9E0;color:#1A1A1A;padding:36px;font-family:IALOGothamNarrow,Arial,sans-serif;}
.contact h1{font:500 38px/1 IALOGothamNarrow,Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;margin:0 0 12px;}
.contact p{font:500 22px/1.2 IALOGothamNarrow,Arial,sans-serif;margin:0 0 28px;color:#555;}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fill,270px);gap:34px 28px;align-items:start;max-width:1500px;}
.thumb{width:270px;height:337.5px;object-fit:cover;box-shadow:0 10px 30px rgba(0,0,0,.18);background:#111;display:block;}
.cap{font:500 16px/1 IALOGothamNarrow,Arial,sans-serif;margin-top:8px;color:#1A1A1A;text-transform:uppercase;}
.master-section{margin:24px 0 34px;}
.master-label{font:500 28px/1 IALOGothamNarrow,Arial,sans-serif;text-transform:uppercase;margin:0 0 12px;color:#1A1A1A;}
.master-grid{display:grid;grid-template-columns:repeat(auto-fill,172px);gap:14px;max-width:1860px;}
.master-thumb{width:172px;height:215px;object-fit:cover;box-shadow:0 6px 18px rgba(0,0,0,.16);background:#111;display:block;}
`;

function v01SlideHtml(slide, version) {
  const bgSrc = bgDataUris.get(slide.bg);
  const logoClass = 'white';
  const counterClass = slide.layout === 'reframe' ? 'counter light' : 'counter';
  return `
    <article class="slide ${version.className} layout-${esc(slide.layout)}" data-slide="${slide.n}" style="--pos:${esc(slide.pos)}">
      <img class="bg-img" src="${bgSrc}" alt="${esc(path.join(bgRoot, slide.bg))}" />
      <div class="veil"></div>
      <div class="${counterClass}">${slide.n}/${totalSlides}</div>
      ${slide.layout === 'quote' ? '<div class="bar"></div>' : ''}
      ${slide.layout === 'split' ? '<div class="panel"></div>' : ''}
      ${slide.layout === 'distinction' ? '<div class="top"></div><div class="mini"><div class="support">' + br(slide.supporting) + '</div></div>' : ''}
      ${slide.layout === 'quote'
        ? `<div class="card"><div class="quote">${br(slide.text)}</div></div>`
        : slide.layout === 'reframe'
          ? `<div class="card"><div class="text">${br(slide.text)}</div><div class="support">${br(slide.supporting)}</div></div>`
          : `<div class="text ${slide.layout === 'cover' ? 'futura shadow' : 'shadow'}">${br(slide.text)}</div>`}
      ${slide.supporting && !['reframe', 'distinction'].includes(slide.layout) ? `<div class="support">${br(slide.supporting)}</div>` : ''}
      ${slide.layout === 'poetic' ? '<div class="line"></div>' : ''}
      <div class="accent"></div>
      <img class="logo-img ${logoClass}" src="${logoDataUri}" alt="IALO" />
    </article>`;
}

function v02SlideHtml(slide, version) {
  const bgSrc = bgDataUris.get(slide.bg);
  const support = slide.supporting ? `<div class="support">${br(slide.supporting)}</div>` : '';
  const mainClass = slide.layout === 'cover' ? 'text futura shadow' : 'text shadow';
  return `
    <article class="slide ${version.className}" data-slide="${slide.n}">
      <img class="bg-img" src="${bgSrc}" alt="${esc(path.join(bgRoot, slide.bg))}" />
      <div class="veil"></div>
      <div class="accent"></div>
      <div class="counter">${slide.n}/${totalSlides}</div>
      <div class="${mainClass}">${br(slide.text)}</div>
      ${support}
      <img class="logo-img" src="${logoDataUri}" alt="IALO" />
    </article>`;
}

function slideHtml(slide, version) {
  return version.id === 'v01_cinematic_sober' ? v01SlideHtml(slide, version) : v02SlideHtml(slide, version);
}

function slideDocument(version, slide) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="render">${slideHtml(slide, version)}</body></html>`;
}

function contactImageDataUri(absPath) {
  return pngDataUri(absPath);
}

function contactSheetHtml(version, versionDir) {
  const items = slideData.map((slide) => {
    const abs = path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`);
    const src = contactImageDataUri(abs);
    return `<div><img class="thumb" src="${src}" /><div class="cap">${String(slide.n).padStart(2, '0')} · ${esc(slide.role)} · ${esc(slide.bg)}</div></div>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact"><h1>${esc(version.label)}</h1><p>${esc(version.description)} · ${totalSlides} slides · Real assets embedded · 1080×1350 PNGs</p><main class="contact-grid">${items}</main></body></html>`;
}

function masterHtml() {
  const sections = versions.map((version) => {
    const versionDir = path.join(outRoot, version.id);
    const thumbs = slideData.map((slide) => {
      const abs = path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`);
      return `<img class="master-thumb" src="${contactImageDataUri(abs)}" />`;
    }).join('\n');
    return `<section class="master-section"><div class="master-label">${esc(version.label)}</div><div class="master-grid">${thumbs}</div></section>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact"><h1>IALO · manual content approval pack · V01 + V02</h1><p>Fuente: ${esc(contentFile)} · ${totalSlides} slides variables · elegir una sola versión para publicar en Blotato.</p>${sections}</body></html>`;
}

async function waitForAssets(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(document.images || []);
    await Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })));
    const broken = images.filter((img) => !img.naturalWidth || !img.naturalHeight).map((img) => img.getAttribute('alt') || img.getAttribute('src')?.slice(0, 80));
    if (broken.length) throw new Error(`Broken embedded image assets: ${broken.join(', ')}`);
  });
}

const manifest = {
  content_id: content.content_id,
  content_origin: content.content_origin || 'manual_chat_cocreation',
  source_content_file: contentFile,
  thesis_id: thesisId,
  thesis: thesis.label,
  title: content.title || null,
  slide_count: totalSlides,
  output_status: 'pending_human_approval',
  publication_target: 'blotato',
  publication_rule: 'Render both versions. Human chooses exactly one approved version. Only the approved version should be sent to Blotato.',
  render_quality: 'manual_variable_slides_v01_locked_v02_minimal_darker',
  logo: registry.logo,
  fonts: registry.fonts,
  versions: versions.map((version) => ({
    id: version.id,
    label: version.label,
    description: version.description,
    folder: `${version.id}/`,
    contact_sheet: `${version.id}/contact_sheet.png`,
    approved_for_publication: false
  })),
  slides: slideData.map(({ n, originalNumber, role, layout, bg, pos, text, supporting }) => ({
    n,
    original_number: originalNumber,
    role,
    layout,
    background: path.join(bgRoot, bg),
    position: pos,
    text,
    supporting_text: supporting || null
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
    await waitForAssets(page);
    await page.locator('.slide').first().screenshot({ path: path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`) });
  }
  await page.close();

  const contact = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
  await contact.setContent(contactSheetHtml(version, versionDir), { waitUntil: 'load' });
  await waitForAssets(contact);
  await contact.locator('body').screenshot({ path: path.join(versionDir, 'contact_sheet.png') });
  await contact.close();
}

const master = await browser.newPage({ viewport: { width: 1980, height: 1400 }, deviceScaleFactor: 1 });
await master.setContent(masterHtml(), { waitUntil: 'load' });
await waitForAssets(master);
await master.locator('body').screenshot({ path: path.join(outRoot, 'approval_contact_sheet_all_versions.png') });
await master.close();

await browser.close();

const summary = {
  content_id: content.content_id,
  content_file: contentFile,
  thesis_id: thesisId,
  slide_count: totalSlides,
  output_folder: 'dist/ialo_content_approval_pack',
  artifact_expected: 'ialo_manual_content_approval_pack'
};
fs.writeFileSync(path.join(outRoot, 'render_summary.json'), JSON.stringify(summary, null, 2));
console.log(`Rendered manual content approval pack to ${outRoot}`);
