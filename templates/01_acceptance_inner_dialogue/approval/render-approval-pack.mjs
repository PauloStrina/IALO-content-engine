import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
    description: 'Más profundo, atmosférico y contemplativo. Prioriza foto real, oscuridad, silencio y continuidad visual.',
    className: 'v01'
  },
  {
    id: 'v02_editorial_disruptive',
    label: 'V02 · Editorial disruptive',
    description: 'Más scrolleable, más contraste, más placas editoriales y cortes visuales fuertes.',
    className: 'v02'
  },
  {
    id: 'v03_hybrid_main',
    label: 'V03 · Hybrid main',
    description: 'Intermedio: mantiene impacto y variación, pero con mayor orden de sistema.',
    className: 'v03'
  }
];

const slideData = [
  { n: 1, role: 'cold_open', layout: 'cover', bg: 'Lluvia 1.jpg', pos: 'center center', text: '¿CUÁNTA ENERGÍA\nESTÁS GASTANDO\nEN PELEAR\nCON LO QUE\nYA ES?' },
  { n: 2, role: 'pause', layout: 'pause', bg: 'Ventana 1.jpg', pos: 'center center', text: 'A veces no duele solamente lo que pasa.', supporting: 'Duele la pelea interna\ncontra lo que pasa.' },
  { n: 3, role: 'resistance', layout: 'quote', bg: 'Pieza 2.jpg', pos: 'center center', text: '“Esto no debería estar pasando.”\n\n“Yo ya tendría que estar en otro lugar.”\n\n“No debería sentir esto.”' },
  { n: 4, role: 'cost', layout: 'split', bg: 'Silla Libro 1.jpg', pos: 'center center', text: 'Esa pelea interna también cansa.', supporting: 'A veces la confundimos con acción.\nPero muchas veces es resistencia usando otro nombre.' },
  { n: 5, role: 'invisible_cost', layout: 'poetic', bg: 'Lluvia 2.jpg', pos: 'center center', text: 'Lo que no podés mirar\nsuele empezar a manejarte\nen silencio.' },
  { n: 6, role: 'reframe', layout: 'reframe', bg: 'Pieza 1.jpg', pos: 'center center', text: 'Aceptar no es rendirse.', supporting: 'Es dejar de discutir con la realidad\npara poder responder mejor.' },
  { n: 7, role: 'distinction', layout: 'distinction', bg: 'Pieza 4.jpg', pos: 'center center', text: 'No es resignación.\nEs presencia.', supporting: 'Resignarse apaga.\nAceptar ordena.' },
  { n: 8, role: 'integration', layout: 'center', bg: 'Silla Libro 2.jpg', pos: 'center center', text: 'Porque lo que es,\nprimero se mira.\n\nDespués se transforma.' },
  { n: 9, role: 'question', layout: 'question', bg: 'Ventana 1.jpg', pos: 'center center', text: '¿Qué estás resistiendo que, si pudieras mirar de frente, empezaría a transformarse?' },
  { n: 10, role: 'closing', layout: 'closing', bg: 'Lluvia 1.jpg', pos: 'center center', text: 'Lo visible es consecuencia.\nLo invisible es causa.', supporting: 'Guardalo para volver a esta pregunta cuando vuelvas a pelear con lo que es.' }
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

console.log('Rendering IALO approval pack with REAL assets:');
for (const slide of slideData) console.log(`slide ${slide.n}: ${path.join(bgRoot, slide.bg)}`);
console.log(`logo: ${registry.logo}`);

function fileUrl(repoRelativePath) {
  return pathToFileURL(path.join(repoRoot, repoRelativePath)).href;
}

function outputFileUrl(...parts) {
  return pathToFileURL(path.join(...parts)).href;
}

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

const fontCss = `
@font-face{font-family:IALOFutura;src:url("${fileUrl(registry.fonts.futura_condensed_extra_bold)}") format('woff');font-weight:900;font-style:normal;font-display:block;}
@font-face{font-family:IALOGothamNarrow;src:url("${fileUrl(registry.fonts.gotham_narrow_medium)}") format('woff');font-weight:500;font-style:normal;font-display:block;}
@font-face{font-family:IALOLyonText;src:url("${fileUrl(registry.fonts.lyon_text_regular)}") format('woff');font-weight:400;font-style:normal;font-display:block;}
@font-face{font-family:IALOLyonDisplay;src:url("${fileUrl(registry.fonts.lyon_display_regular)}") format('woff');font-weight:400;font-style:normal;font-display:block;}
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

/* Base layouts: V03/hybrid geometry */
.layout-cover .text{left:72px;top:240px;width:875px;font:900 106px/.77 IALOFutura,Impact,sans-serif}.layout-cover .accent{left:76px;top:980px}
.layout-pause .text{left:86px;top:315px;width:820px;font:64px/1.02 IALOLyonDisplay,Georgia,serif}.layout-pause .support{left:86px;top:650px;width:790px;font:50px/1.1 IALOLyonText,Georgia,serif}.layout-pause .accent{left:86px;top:555px;width:55px}
.layout-quote .card{left:92px;top:200px;width:788px;min-height:815px;border-radius:18px;background:rgba(238,233,224,.96);color:var(--black);padding:105px 54px}.layout-quote .bar{position:absolute;z-index:36;left:92px;top:200px;width:20px;height:815px;background:var(--orange)}.layout-quote .quote{position:relative;font:58px/1.08 IALOLyonDisplay,Georgia,serif;white-space:pre-line;color:var(--black)}
.layout-split .panel{left:0;top:0;width:530px;height:100%;background:var(--black)}.layout-split .text{left:70px;top:255px;width:425px;font:74px/1 IALOLyonDisplay,Georgia,serif}.layout-split .support{left:70px;top:700px;width:395px;font:42px/1.12 IALOLyonText,Georgia,serif}.layout-split .accent{left:70px;top:610px;width:80px}
.layout-poetic .text{left:76px;top:390px;width:860px;font:76px/1 IALOLyonDisplay,Georgia,serif}.layout-poetic .line{position:absolute;z-index:34;left:76px;top:1085px;width:394px;height:2px;background:rgba(238,233,224,.8)}
.layout-reframe .card{left:72px;top:270px;width:868px;height:545px;border-radius:22px;background:rgba(238,233,224,.94);color:var(--black);padding:110px 36px}.layout-reframe .accent{left:108px;top:320px}.layout-reframe .text{position:relative;left:auto;top:auto;width:auto;font:78px/1 IALOLyonDisplay,Georgia,serif;color:var(--black);margin:0 0 62px}.layout-reframe .support{position:relative;left:auto;top:auto;width:760px;font:46px/1.11 IALOLyonText,Georgia,serif;color:var(--black)}
.layout-distinction .top{position:absolute;z-index:27;left:0;top:0;width:100%;height:355px;background:var(--cream);color:var(--black)}.layout-distinction .text{left:76px;top:92px;width:860px;font:76px/.98 IALOLyonDisplay,Georgia,serif;color:var(--black)}.layout-distinction .mini{position:absolute;z-index:28;left:76px;top:785px;width:664px;height:225px;border-radius:18px;background:rgba(26,26,26,.92);padding:90px 34px 0}.layout-distinction .support{position:relative;left:auto;top:auto;width:auto;font:48px/1.1 IALOLyonText,Georgia,serif}.layout-distinction .accent{left:110px;top:835px;width:62px}
.layout-center .text{left:145px;top:360px;width:790px;text-align:center;font:82px/1 IALOLyonDisplay,Georgia,serif}.layout-question .accent{left:76px;top:260px;width:72px}.layout-question .text{left:76px;top:340px;width:830px;font:70px/1.02 IALOLyonDisplay,Georgia,serif}.layout-closing{background:var(--cream);color:var(--black)}.layout-closing .bg-img{top:auto;height:530px;bottom:0}.layout-closing .text{left:76px;top:270px;width:870px;font:78px/1.02 IALOLyonDisplay,Georgia,serif;color:var(--black)}.layout-closing .support{left:76px;top:635px;width:780px;font:40px/1.12 IALOLyonText,Georgia,serif;color:var(--black)}.layout-closing .accent{left:76px;top:570px;width:76px}

/* V01 — cinematic sober: closer to first test */
.v01 .bg-img{filter:saturate(.70) contrast(1.12) brightness(.78)}
.v01 .veil{background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.38) 68%,rgba(0,0,0,.62)),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.54))}
.v01 .counter{left:76px;right:auto;background:transparent;border:1px solid rgba(238,233,224,.42);font-size:28px;color:var(--cream)}
.v01 .layout-cover .text{top:310px;width:840px;font-family:IALOLyonDisplay,Georgia,serif;font-size:78px;line-height:1.02;text-transform:none;letter-spacing:-.02em}.v01 .layout-cover .accent{top:910px;width:58px;height:7px}
.v01 .layout-pause .text,.v01 .layout-poetic .text,.v01 .layout-center .text,.v01 .layout-question .text{left:98px;width:820px;font-size:66px;line-height:1.04}.v01 .layout-pause .support{font-size:44px;top:620px}.v01 .layout-quote .card{background:rgba(26,26,26,.70);border:1px solid rgba(238,233,224,.28);color:var(--cream);left:98px;width:780px}.v01 .layout-quote .quote{color:var(--cream);font-size:54px}.v01 .layout-quote .bar{left:98px;width:8px}
.v01 .layout-split .panel{background:rgba(26,26,26,.72);width:100%}.v01 .layout-split .text{width:780px;font-size:66px}.v01 .layout-split .support{width:760px;font-size:42px}.v01 .layout-reframe .card,.v01 .layout-distinction .mini{background:rgba(26,26,26,.72);border:1px solid rgba(238,233,224,.26);color:var(--cream)}.v01 .layout-reframe .text,.v01 .layout-reframe .support{color:var(--cream)}.v01 .layout-distinction .top{background:rgba(26,26,26,.72);border-bottom:1px solid rgba(238,233,224,.2)}.v01 .layout-distinction .text{color:var(--cream)}.v01.layout-closing{background:#111}.v01.layout-closing .bg-img{height:100%;top:0}.v01.layout-closing .text,.v01.layout-closing .support{color:var(--cream)}

/* V02 — editorial disruptive: closer to second test */
.v02 .bg-img{filter:saturate(.96) contrast(1.10) brightness(1.0)}.v02 .veil{background:linear-gradient(90deg,rgba(0,0,0,.20),rgba(0,0,0,.02) 58%,rgba(0,0,0,.16))}
.v02 .layout-cover .text{font-size:112px;line-height:.74}.v02 .layout-pause .card-lite{position:absolute;z-index:25;left:0;top:0;width:100%;height:410px;background:rgba(238,233,224,.95)}.v02 .layout-pause .text{color:var(--black);text-shadow:none;top:92px}.v02 .layout-pause .support{top:825px;background:rgba(26,26,26,.82);padding:36px;border-radius:18px}.v02 .layout-quote .card{left:112px;top:235px;width:760px;transform:rotate(-1deg);box-shadow:0 30px 90px rgba(0,0,0,.28)}.v02 .layout-split .panel{width:560px}.v02 .layout-poetic .text{font-size:82px}.v02 .layout-reframe .card{box-shadow:0 30px 100px rgba(0,0,0,.28)}.v02 .layout-question .text{background:rgba(26,26,26,.86);padding:54px;border-radius:24px;width:870px;left:70px;top:310px}.v02 .layout-closing .bg-img{height:520px}.v02 .counter{border-radius:0;padding:13px 18px 8px}

/* V03 — hybrid */
.v03 .bg-img{filter:saturate(.84) contrast(1.05) brightness(.95)}.v03 .veil{background:linear-gradient(90deg,rgba(0,0,0,.38),rgba(0,0,0,.10) 62%,rgba(0,0,0,.28))}
.v03.layout-question .veil{background:linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.10) 68%,transparent)}

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

function slideHtml(slide, version) {
  const bgPath = path.join(bgRoot, slide.bg);
  const logoClass = 'white';
  const counterClass = slide.layout === 'reframe' ? 'counter light' : 'counter';
  const extraPauseCard = version.id === 'v02_editorial_disruptive' && slide.layout === 'pause' ? '<div class="card-lite"></div>' : '';
  return `
    <article class="slide ${version.className} layout-${slide.layout}" data-slide="${slide.n}" style="--pos:${esc(slide.pos)}">
      <img class="bg-img" src="${fileUrl(bgPath)}" alt="${esc(bgPath)}" />
      <div class="veil"></div>
      ${extraPauseCard}
      <div class="${counterClass}">${slide.n}/10</div>
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
      <img class="logo-img ${logoClass}" src="${fileUrl(registry.logo)}" alt="IALO" />
    </article>`;
}

function slideDocument(version, slide) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="render">${slideHtml(slide, version)}</body></html>`;
}

function contactSheetHtml(version, versionDir) {
  const items = slideData.map((slide) => {
    const src = outputFileUrl(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`);
    return `<div><img class="thumb" src="${src}" /><div class="cap">${String(slide.n).padStart(2, '0')} · ${esc(slide.role)} · ${esc(slide.bg)}</div></div>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact"><h1>${esc(version.label)}</h1><p>${esc(version.description)} · Real assets · 1080×1350 PNGs</p><main class="contact-grid">${items}</main></body></html>`;
}

function masterHtml() {
  const rows = versions.map((version) => {
    const versionDir = path.join(outRoot, version.id);
    const thumbs = slideData.map((slide) => `<img class="master-thumb" src="${outputFileUrl(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`)}" />`).join('\n');
    return `<div class="master-label">${esc(version.label)}</div>${thumbs}`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact"><h1>IALO · approval pack · real assets · 3 visual versions</h1><p>Elegir una sola versión para publicar en Blotato. Las tres usan las fotos reales, logo real y fuentes reales.</p><main class="master-grid">${rows}</main></body></html>`;
}

async function waitForAssets(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(document.images || []);
    await Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })));
    const broken = images.filter((img) => !img.naturalWidth || !img.naturalHeight).map((img) => img.getAttribute('src'));
    if (broken.length) throw new Error(`Broken image assets: ${broken.join(', ')}`);
  });
}

const manifest = {
  content_id: 'ialo_acceptance_inner_dialogue_approval_pack_real_assets_v2',
  thesis_id: thesisId,
  thesis: thesis.label,
  output_status: 'pending_human_approval',
  publication_target: 'blotato',
  publication_rule: 'Render all versions. Human chooses exactly one approved version. Only the approved version should be sent to Blotato.',
  render_quality: 'real_assets_high_fidelity',
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
  slides: slideData.map(({ n, role, layout, bg, pos, text, supporting }) => ({
    n,
    role,
    layout,
    background: path.join(bgRoot, bg),
    position: pos,
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
    await waitForAssets(page);
    await page.locator('.slide').first().screenshot({ path: path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`) });
  }
  await page.close();

  const contact = await browser.newPage({ viewport: { width: 1600, height: 1120 }, deviceScaleFactor: 1 });
  await contact.setContent(contactSheetHtml(version, versionDir), { waitUntil: 'load' });
  await waitForAssets(contact);
  await contact.locator('body').screenshot({ path: path.join(versionDir, 'contact_sheet.png') });
  await contact.close();
}

const master = await browser.newPage({ viewport: { width: 1980, height: 980 }, deviceScaleFactor: 1 });
await master.setContent(masterHtml(), { waitUntil: 'load' });
await waitForAssets(master);
await master.locator('body').screenshot({ path: path.join(outRoot, 'approval_contact_sheet_all_versions.png') });
await master.close();

await browser.close();
console.log(`Rendered REAL ASSETS approval pack to ${outRoot}`);
