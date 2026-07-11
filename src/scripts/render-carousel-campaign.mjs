import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const campaignDir = process.env.CAMPAIGN_DIR || "content/campaigns/2026-07-14-eight-weeks";
const contentDir = path.join(campaignDir, "carousels");
const registryPath = process.env.IALO_ASSET_REGISTRY || "templates/ialo.assets.json";
const outputRoot = process.env.CAMPAIGN_OUTPUT_DIR || "public-assets/campaigns/2026-07-14-eight-weeks";

const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
const config = JSON.parse(await fs.readFile(path.join(campaignDir, "campaign.config.json"), "utf8"));
const templateVersion = config.visual_system?.template_version || "v02_minimal_constant_text";
const files = (await fs.readdir(contentDir)).filter((file) => file.endsWith(".json")).sort();

if (files.length !== config.cadence.total_posts) {
  throw new Error(`Expected ${config.cadence.total_posts} carousels, found ${files.length}`);
}

if (templateVersion !== "v02_minimal_constant_text") {
  throw new Error(`This campaign renderer expects v02_minimal_constant_text, received ${templateVersion}`);
}

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const splitCopy = (text = "") => {
  const blocks = String(text)
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    main: blocks[0] || String(text).trim(),
    support: blocks.slice(1).join("\n\n")
  };
};

function densityClass(text = "") {
  const length = String(text).replace(/\s+/g, " ").trim().length;
  if (length > 420) return "density-xl";
  if (length > 300) return "density-l";
  if (length > 185) return "density-m";
  return "density-s";
}

function pickBackground(thesis, slide, index, variant) {
  if (slide.background) return slide.background;
  const offset = variant === "B" ? 2 : 0;
  return thesis.images[(index + offset) % thesis.images.length];
}

function css(fonts) {
  return `
@font-face{font-family:IALOFutura;src:url('${fonts.futura}') format('woff');font-weight:800}
@font-face{font-family:IALOLyonText;src:url('${fonts.lyonText}') format('woff')}
@font-face{font-family:IALOLyonDisplay;src:url('${fonts.lyonDisplay}') format('woff')}
:root{--cream:#EEE9E0;--black:#1A1A1A;--orange:#FF5000}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1350px;overflow:hidden}
body{background:var(--black);color:var(--cream)}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:var(--black)}
.bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;filter:saturate(.72) contrast(1.08) brightness(.68)}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.70) 0%,rgba(0,0,0,.52) 56%,rgba(0,0,0,.35) 100%),linear-gradient(180deg,rgba(0,0,0,.12) 0%,rgba(0,0,0,.16) 62%,rgba(0,0,0,.54) 100%)}
.counter{position:absolute;z-index:20;left:76px;top:70px;border:1px solid rgba(238,233,224,.48);border-radius:40px;padding:11px 20px 9px;color:var(--cream);font:800 28px/1 IALOFutura,Impact,sans-serif;background:rgba(26,26,26,.20)}
.logo{position:absolute;z-index:20;left:76px;bottom:66px;width:74px;height:auto;filter:drop-shadow(0 2px 10px rgba(0,0,0,.45))}
.accent{position:absolute;z-index:18;left:76px;top:238px;width:58px;height:7px;background:var(--orange)}
.copy{position:absolute;z-index:16;left:76px;top:292px;width:855px;color:var(--cream)}
.main{white-space:pre-line;font-family:IALOLyonDisplay,Georgia,serif;font-size:68px;line-height:1.04;text-shadow:0 4px 24px rgba(0,0,0,.86)}
.support{margin-top:46px;white-space:pre-line;font-family:IALOLyonText,Georgia,serif;font-size:40px;line-height:1.14;text-shadow:0 3px 18px rgba(0,0,0,.88)}
.slide.is-cover .copy{top:50%;transform:translateY(-50%)}
.slide.is-cover .accent{top:calc(50% - 185px)}
.slide.is-cover .main{font-size:84px;line-height:1.00}
.slide.is-cover.density-m .main{font-size:72px;line-height:1.03}
.slide.is-cover.density-l .main,.slide.is-cover.density-xl .main{font-size:58px;line-height:1.07}
.slide.density-m:not(.is-cover) .main{font-size:58px;line-height:1.08}
.slide.density-m:not(.is-cover) .support{font-size:36px;line-height:1.16}
.slide.density-l:not(.is-cover) .main{font-size:48px;line-height:1.10}
.slide.density-l:not(.is-cover) .support{font-size:32px;line-height:1.17}
.slide.density-xl:not(.is-cover) .main{font-size:40px;line-height:1.12}
.slide.density-xl:not(.is-cover) .support{font-size:29px;line-height:1.19}
`;
}

function slideMarkup({ slide, index, total, backgroundUrl, logoUrl, fonts }) {
  const copy = splitCopy(slide.text);
  const density = densityClass(slide.text);
  const coverClass = index === 0 ? " is-cover" : "";
  const support = copy.support ? `<div class="support">${esc(copy.support)}</div>` : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>${css(fonts)}</style>
</head>
<body>
  <article class="slide ${density}${coverClass}">
    <div class="bg" style="background-image:url('${backgroundUrl}')"></div>
    <div class="veil"></div>
    <div class="counter">${index + 1}/${total}</div>
    <div class="accent"></div>
    <div class="copy">
      <div class="main">${esc(copy.main)}</div>
      ${support}
    </div>
    <img class="logo" src="${logoUrl}" alt="IALO"/>
  </article>
</body>
</html>`;
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });
const tmpDir = path.join(outputRoot, "_tmp_html");
await fs.mkdir(tmpDir, { recursive: true });

const fontUrls = {
  futura: pathToFileURL(path.resolve(registry.fonts.futura_condensed_extra_bold)).href,
  lyonText: pathToFileURL(path.resolve(registry.fonts.lyon_text_regular)).href,
  lyonDisplay: pathToFileURL(path.resolve(registry.fonts.lyon_display_regular)).href
};
const logoUrl = pathToFileURL(path.resolve(registry.logo)).href;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const campaignIndex = [];

for (const file of files) {
  const content = JSON.parse(await fs.readFile(path.join(contentDir, file), "utf8"));
  const thesis = registry.backgrounds_by_thesis[content.thesis_id];

  if (!thesis) throw new Error(`Unknown thesis_id ${content.thesis_id} in ${file}`);
  if (!Array.isArray(content.slides) || content.slides.length < 5) {
    throw new Error(`${file} needs at least 5 slides`);
  }

  const outDir = path.join(outputRoot, content.content_id);
  await fs.mkdir(outDir, { recursive: true });

  for (const [index, slide] of content.slides.entries()) {
    const background = pickBackground(thesis, slide, index, content.variant);
    const bgPath = path.resolve(thesis.folder, background);

    try {
      await fs.access(bgPath);
    } catch {
      throw new Error(`Missing background: ${bgPath}`);
    }

    const html = slideMarkup({
      slide,
      index,
      total: content.slides.length,
      backgroundUrl: pathToFileURL(bgPath).href,
      logoUrl,
      fonts: fontUrls
    });

    const htmlPath = path.join(tmpDir, `${content.content_id}-${String(index + 1).padStart(2, "0")}.html`);
    await fs.writeFile(htmlPath, html);
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
    });
    await page.locator(".slide").screenshot({
      path: path.join(outDir, `slide-${String(index + 1).padStart(2, "0")}.png`)
    });
  }

  await fs.writeFile(
    path.join(outDir, "metadata.json"),
    `${JSON.stringify({ ...content, template: templateVersion }, null, 2)}\n`
  );

  campaignIndex.push({
    content_id: content.content_id,
    week: content.week,
    variant: content.variant,
    publish_at: content.publish_at,
    slides: content.slides.length,
    template: templateVersion
  });
}

await browser.close();
await fs.rm(tmpDir, { recursive: true, force: true });
await fs.writeFile(
  path.join(outputRoot, "campaign-index.json"),
  `${JSON.stringify({ campaign_id: config.campaign_id, template: templateVersion, rendered_at: new Date().toISOString(), items: campaignIndex }, null, 2)}\n`
);
console.log(`Rendered ${campaignIndex.length} carousels with ${templateVersion} to ${outputRoot}`);
