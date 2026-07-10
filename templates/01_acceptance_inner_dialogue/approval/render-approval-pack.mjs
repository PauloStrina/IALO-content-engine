import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const assetRegistryPath = path.join(repoRoot, 'templates/ialo.assets.json');
const registry = JSON.parse(fs.readFileSync(assetRegistryPath, 'utf8'));

const thesisId = '01_acceptance_inner_dialogue';
const thesis = registry.backgrounds_by_thesis[thesisId];
const bgRoot = thesis.folder;
const outRoot = path.join(repoRoot, 'dist/ialo_acceptance_approval_pack');
fs.mkdirSync(outRoot, { recursive: true });

const versions = [
  {
    id: 'v01_cinematic_sober',
    label: 'V01 · Cinematic sober',
    description: 'Más IALO, más profundo, más atmosférico. Menos disruptivo, más journaling cinematográfico.',
    bodyClass: 'variant-v01'
  },
  {
    id: 'v02_editorial_disruptive',
    label: 'V02 · Editorial disruptive',
    description: 'Más scroll, más cortes visuales, más placas y contraste editorial.',
    bodyClass: 'variant-v02'
  },
  {
    id: 'v03_hybrid_main',
    label: 'V03 · Hybrid main',
    description: 'Intermedio entre V01 y V02. Mantiene impacto, pero más ordenado y automatizable.',
    bodyClass: 'variant-v03'
  }
];

const slideData = [
  {
    n: 1,
    role: 'cold_open',
    layout: 'cover',
    bg: 'Lluvia 1.jpg',
    text: '¿CUÁNTA ENERGÍA\nESTÁS GASTANDO\nEN PELEAR\nCON LO QUE\nYA ES?'
  },
  {
    n: 2,
    role: 'pause',
    layout: 'pause',
    bg: 'Ventana 1.jpg',
    text: 'A veces no duele solamente lo que pasa.',
    supporting: 'Duele la pelea interna\ncontra lo que pasa.'
  },
  {
    n: 3,
    role: 'resistance',
    layout: 'quote',
    bg: 'Pieza 2.jpg',
    text: '“Esto no debería estar pasando.”\n\n“Yo ya tendría que estar en otro lugar.”\n\n“No debería sentir esto.”'
  },
  {
    n: 4,
    role: 'cost',
    layout: 'split',
    bg: 'Silla Libro 1.jpg',
    text: 'Esa pelea interna también cansa.',
    supporting: 'A veces la confundimos con acción.\nPero muchas veces es resistencia usando otro nombre.'
  },
  {
    n: 5,
    role: 'invisible_cost',
    layout: 'poetic',
    bg: 'Lluvia 2.jpg',
    text: 'Lo que no podés mirar\nsuele empezar a manejarte\nen silencio.'
  },
  {
    n: 6,
    role: 'reframe',
    layout: 'reframe',
    bg: 'Pieza 1.jpg',
    text: 'Aceptar no es rendirse.',
    supporting: 'Es dejar de discutir con la realidad\npara poder responder mejor.'
  },
  {
    n: 7,
    role: 'distinction',
    layout: 'distinction',
    bg: 'Pieza 4.jpg',
    text: 'No es resignación.\nEs presencia.',
    supporting: 'Resignarse apaga.\nAceptar ordena.'
  },
  {
    n: 8,
    role: 'integration',
    layout: 'center',
    bg: 'Silla Libro 2.jpg',
    text: 'Porque lo que es,\nprimero se mira.\n\nDespués se transforma.'
  },
  {
    n: 9,
    role: 'question',
    layout: 'question',
    bg: 'Ventana 1.jpg',
    text: '¿Qué estás resistiendo que, si pudieras mirar de frente, empezaría a transformarse?'
  },
  {
    n: 10,
    role: 'closing',
    layout: 'closing',
    bg: 'Lluvia 1.jpg',
    text: 'Lo visible es consecuencia.\nLo invisible es causa.',
    supporting: 'Guardalo para volver a esta pregunta cuando vuelvas a pelear con lo que es.'
  }
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

function fileUrl(repoRelativePath) {
  return pathToFileURL(path.join(repoRoot, repoRelativePath)).href;
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

function cssUrl(repoRelativePath) {
  return `url("${fileUrl(repoRelativePath)}")`;
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
html,body{margin:0;background:#101010;color:var(--cream);font-family:IALOLyonText,Georgia,serif;}
.render-single{width:var(--w);height:var(--h);overflow:hidden;background:#101010;}
.contact-page{background:#EEE9E0;color:#1A1A1A;padding:36px;font-family:IALOGothamNarrow,Arial,sans-serif;}
.contact-title{font:500 38px/1 IALOGothamNarrow,Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;margin:0 0 20px;}
.contact-note{font:500 22px/1.2 IALOGothamNarrow,Arial,sans-serif;margin:0 0 28px;color:#555;}
.contact-grid{display:grid;grid-template-columns:repeat(5,270px);gap:34px 28px;align-items:start;}
.master-grid{display:grid;grid-template-columns:repeat(10,172px);gap:14px;align-items:start;}
.master-label{grid-column:1/-1;font:500 28px/1 IALOGothamNarrow,Arial,sans-serif;text-transform:uppercase;margin:24px 0 4px;color:#1A1A1A;}
.stage{width:270px;height:337.5px;overflow:hidden;position:relative;background:#111;box-shadow:0 10px 30px rgba(0,0,0,.18);}
.stage.master{width:172px;height:215px;box-shadow:0 6px 18px rgba(0,0,0,.16);}
.stage .slide{transform-origin:top left;transform:scale(.25);}
.stage.master .slide{transform:scale(.159259);}
.stage-caption{font:500 16px/1 IALOGothamNarrow,Arial,sans-serif;margin-top:8px;color:#1A1A1A;text-transform:uppercase;}
.slide{width:var(--w);height:var(--h);position:relative;overflow:hidden;background:#222;color:var(--cream);}
.photo{position:absolute;inset:0;background-image:var(--bg);background-size:cover;background-position:center;filter:saturate(.84) contrast(1.05);}
.photo::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.42),rgba(0,0,0,.12) 62%,rgba(0,0,0,.30));}
.logo-img{position:absolute;left:76px;bottom:68px;width:76px;height:auto;z-index:40;object-fit:contain;}
.logo-img.white{filter:brightness(0) invert(1);opacity:.96}.logo-img.black{filter:brightness(0);opacity:.92}
.counter{position:absolute;right:76px;top:68px;z-index:40;border-radius:36px;padding:13px 23px 10px;font:900 32px/1 IALOFutura,Impact,sans-serif;background:rgba(26,26,26,.72);color:var(--cream)}
.counter.light{background:rgba(238,233,224,.9);color:var(--black)}
.accent{position:absolute;z-index:30;background:var(--orange);width:88px;height:9px}.shadow{text-shadow:4px 5px 0 rgba(0,0,0,.30)}
.text,.support,.quote{position:absolute;z-index:30}.text{font-family:IALOLyonDisplay,Georgia,serif}.support{font-family:IALOLyonText,Georgia,serif}.futura{font-family:IALOFutura,Impact,'Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:-.025em}.card{position:absolute;z-index:25}.panel{position:absolute;z-index:24}

/* shared layout defaults */
.layout-cover .text{left:72px;top:240px;width:875px;font:900 106px/.77 IALOFutura,Impact,sans-serif}.layout-cover .accent{left:76px;top:980px}
.layout-pause .text{left:86px;top:315px;width:820px;font:64px/1.02 IALOLyonDisplay,Georgia,serif}.layout-pause .support{left:86px;top:650px;width:790px;font:50px/1.1 IALOLyonText,Georgia,serif}.layout-pause .accent{left:86px;top:555px;width:55px}
.layout-quote .card{left:92px;top:200px;width:788px;min-height:815px;border-radius:18px;background:rgba(238,233,224,.96);color:var(--black);padding:105px 54px}.layout-quote .bar{position:absolute;z-index:31;left:92px;top:200px;width:20px;height:815px;background:var(--orange)}.layout-quote .quote{position:relative;font:58px/1.08 IALOLyonDisplay,Georgia,serif;white-space:pre-line;color:var(--black)}
.layout-split .panel{left:0;top:0;width:530px;height:100%;background:var(--black)}.layout-split .text{left:70px;top:255px;width:425px;font:74px/1 IALOLyonDisplay,Georgia,serif}.layout-split .support{left:70px;top:700px;width:395px;font:42px/1.12 IALOLyonText,Georgia,serif}.layout-split .accent{left:70px;top:610px;width:80px}
.layout-poetic .text{left:76px;top:390px;width:860px;font:76px/1 IALOLyonDisplay,Georgia,serif}.layout-poetic .line{position:absolute;z-index:30;left:76px;top:1085px;width:394px;height:2px;background:rgba(238,233,224,.8)}
.layout-reframe .card{left:72px;top:270px;width:868px;height:545px;border-radius:22px;background:rgba(238,233,224,.94);color:var(--black);padding:110px 36px}.layout-reframe .accent{left:108px;top:320px}.layout-reframe .text{position:relative;left:auto;top:auto;width:auto;font:78px/1 IALOLyonDisplay,Georgia,serif;color:var(--black);margin:0 0 62px}.layout-reframe .support{position:relative;left:auto;top:auto;width:760px;font:46px/1.11 IALOLyonText,Georgia,serif;color:var(--black)}
.layout-distinction .top{position:absolute;z-index:24;left:0;top:0;width:100%;height:355px;background:var(--cream);color:var(--black)}.layout-distinction .text{left:76px;top:92px;width:860px;font:76px/.98 IALOLyonDisplay,Georgia,serif;color:var(--black)}.layout-distinction .mini{position:absolute;z-index:25;left:76px;top:785px;width:664px;height:225px;border-radius:18px;background:rgba(26,26,26,.92);padding:90px 34px 0}.layout-distinction .support{position:relative;left:auto;top:auto;width:auto;font:48px/1.1 IALOLyonText,Georgia,serif}.layout-distinction .accent{left:110px;top:835px;width:62px}
.layout-center .text{left:145px;top:360px;width:790px;text-align:center;font:82px/1 IALOLyonDisplay,Georgia,serif}.layout-question .photo::after{background:linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.10) 68%,transparent)}.layout-question .accent{left:76px;top:260px;width:72px}.layout-question .text{left:76px;top:340px;width:830px;font:70px/1.02 IALOLyonDisplay,Georgia,serif}.layout-closing{background:var(--cream);color:var(--black)}.layout-closing .photo{top:auto;height:530px;bottom:0}.layout-closing .photo::after{background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.25))}.layout-closing .text{left:76px;top:270px;width:870px;font:78px/1.02 IALOLyonDisplay,Georgia,serif;color:var(--black)}.layout-closing .support{left:76px;top:635px;width:780px;font:40px/1.12 IALOLyonText,Georgia,serif;color:var(--black)}.layout-closing .accent{left:76px;top:570px;width:76px}

/* V01 cinematic sober */
.variant-v01 .photo{filter:saturate(.70) contrast(1.12) brightness(.82)}.variant-v01 .photo::after{background:linear-gradient(90deg,rgba(0,0,0,.70),rgba(0,0,0,.32) 68%,rgba(0,0,0,.62)),linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.56))}.variant-v01 .counter{left:76px;right:auto;background:transparent;border:1px solid rgba(238,233,224,.42);font-size:28px}.variant-v01 .layout-cover .text{top:320px;font-size:84px;line-height:.86;letter-spacing:-.02em}.variant-v01 .layout-cover .accent{top:875px;width:58px;height:7px}.variant-v01 .layout-pause .text,.variant-v01 .layout-poetic .text,.variant-v01 .layout-center .text,.variant-v01 .layout-question .text{left:98px;width:820px;font-size:66px;line-height:1.04}.variant-v01 .layout-pause .support{font-size:44px;top:620px}.variant-v01 .layout-quote .card{background:rgba(26,26,26,.70);border:1px solid rgba(238,233,224,.28);color:var(--cream);left:98px;width:780px}.variant-v01 .layout-quote .quote{color:var(--cream);font-size:54px}.variant-v01 .layout-quote .bar{left:98px;width:8px}.variant-v01 .layout-split .panel{background:rgba(26,26,26,.72);width:100%}.variant-v01 .layout-split .text{width:780px;font-size:66px}.variant-v01 .layout-split .support{width:760px;font-size:42px}.variant-v01 .layout-reframe .card,.variant-v01 .layout-distinction .mini{background:rgba(26,26,26,.72);border:1px solid rgba(238,233,224,.26);color:var(--cream)}.variant-v01 .layout-reframe .text,.variant-v01 .layout-reframe .support{color:var(--cream)}.variant-v01 .layout-distinction .top{background:rgba(26,26,26,.72);border-bottom:1px solid rgba(238,233,224,.2)}.variant-v01 .layout-distinction .text{color:var(--cream)}.variant-v01 .layout-closing{background:#111}.variant-v01 .layout-closing .photo{height:100%;top:0}.variant-v01 .layout-closing .text,.variant-v01 .layout-closing .support{color:var(--cream)}

/* V02 editorial disruptive */
.variant-v02 .photo{filter:saturate(.96) contrast(1.10)}.variant-v02 .layout-cover .text{font-size:112px;line-height:.74}.variant-v02 .layout-pause .card-lite{position:absolute;z-index:24;left:0;top:0;width:100%;height:410px;background:rgba(238,233,224,.95)}.variant-v02 .layout-pause .text{color:var(--black);text-shadow:none;top:92px}.variant-v02 .layout-pause .support{top:825px;background:rgba(26,26,26,.78);padding:36px;border-radius:18px}.variant-v02 .layout-quote .card{left:112px;top:235px;width:760px;transform:rotate(-1deg);box-shadow:0 30px 90px rgba(0,0,0,.28)}.variant-v02 .layout-split .panel{width:560px}.variant-v02 .layout-poetic .text{font-size:82px}.variant-v02 .layout-reframe .card{box-shadow:0 30px 100px rgba(0,0,0,.28)}.variant-v02 .layout-question .text{background:rgba(26,26,26,.86);padding:54px;border-radius:24px;width:870px;left:70px;top:310px}.variant-v02 .layout-closing .photo{height:520px}.variant-v02 .counter{border-radius:0;padding:13px 18px 8px}

/* V03 hybrid main */
.variant-v03 .photo{filter:saturate(.84) contrast(1.05)}
`;

function slideHtml(slide, version) {
  const bgPath = path.join(bgRoot, slide.bg);
  const logoClass = slide.layout === 'quote' || slide.layout === 'closing' ? 'black' : 'white';
  const counterClass = slide.layout === 'reframe' ? 'counter light' : 'counter';
  const extraPauseCard = version.id === 'v02_editorial_disruptive' && slide.layout === 'pause' ? '<div class="card-lite"></div>' : '';
  return `
    <article class="slide ${version.bodyClass} layout-${slide.layout}" data-slide="${slide.n}" style="--bg:${cssUrl(bgPath)}">
      <div class="photo"></div>
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

function documentHtml(version, mode = 'single', slideNumber = 1) {
  if (mode === 'single') {
    const slide = slideData.find((item) => item.n === slideNumber);
    return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="render-single">${slideHtml(slide, version)}</body></html>`;
  }
  const stages = slideData.map((slide) => `<div><div class="stage">${slideHtml(slide, version)}</div><div class="stage-caption">${String(slide.n).padStart(2, '0')} · ${esc(slide.role)}</div></div>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact-page"><h1 class="contact-title">${esc(version.label)}</h1><p class="contact-note">${esc(version.description)}</p><main class="contact-grid">${stages}</main></body></html>`;
}

function masterHtml() {
  const rows = versions.map((version) => {
    const slides = slideData.map((slide) => `<div class="stage master">${slideHtml(slide, version)}</div>`).join('\n');
    return `<div class="master-label">${esc(version.label)}</div>${slides}`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${baseCss}</style></head><body class="contact-page"><h1 class="contact-title">IALO · approval pack · 3 visual versions</h1><p class="contact-note">Elegir una sola versión para publicar en Blotato. Las tres comparten narrativa, assets y formato.</p><main class="master-grid">${rows}</main></body></html>`;
}

async function waitForAssets(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(document.images || []);
    await Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })));
  });
}

const manifest = {
  content_id: 'ialo_acceptance_inner_dialogue_v03_approval_pack',
  thesis_id: thesisId,
  thesis: thesis.label,
  output_status: 'pending_human_approval',
  publication_target: 'blotato',
  publication_rule: 'Render all versions. Human chooses exactly one approved version. Only the approved version should be sent to Blotato.',
  versions: versions.map((version) => ({
    id: version.id,
    label: version.label,
    description: version.description,
    folder: `${version.id}/`,
    contact_sheet: `${version.id}/contact_sheet.png`,
    approved_for_publication: false
  })),
  slides: slideData.map(({ n, role, layout, bg, text, supporting }) => ({ n, role, layout, background: path.join(bgRoot, bg), text, supporting }))
};
fs.writeFileSync(path.join(outRoot, 'approval_manifest.json'), JSON.stringify(manifest, null, 2));

const browser = await chromium.launch({ headless: true });

for (const version of versions) {
  const versionDir = path.join(outRoot, version.id);
  fs.mkdirSync(versionDir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const slide of slideData) {
    await page.setContent(documentHtml(version, 'single', slide.n), { waitUntil: 'load' });
    await waitForAssets(page);
    const element = await page.locator('.slide').first();
    await element.screenshot({ path: path.join(versionDir, `slide_${String(slide.n).padStart(2, '0')}.png`) });
  }
  await page.close();

  const contact = await browser.newPage({ viewport: { width: 1600, height: 1120 }, deviceScaleFactor: 1 });
  await contact.setContent(documentHtml(version, 'contact'), { waitUntil: 'load' });
  await waitForAssets(contact);
  await contact.locator('body').screenshot({ path: path.join(versionDir, 'contact_sheet.png') });
  await contact.close();
}

const master = await browser.newPage({ viewport: { width: 1900, height: 980 }, deviceScaleFactor: 1 });
await master.setContent(masterHtml(), { waitUntil: 'load' });
await waitForAssets(master);
await master.locator('body').screenshot({ path: path.join(outRoot, 'approval_contact_sheet_all_versions.png') });
await master.close();

await browser.close();
console.log(`Rendered approval pack to ${outRoot}`);
