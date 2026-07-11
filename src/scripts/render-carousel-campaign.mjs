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
const templateVersion = config.visual_system?.template_version || "v02_disruptive";
const files = (await fs.readdir(contentDir)).filter((file) => file.endsWith(".json")).sort();

if (files.length !== config.cadence.total_posts) {
  throw new Error(`Expected ${config.cadence.total_posts} carousels, found ${files.length}`);
}

if (templateVersion !== "v02_disruptive") {
  throw new Error(`This campaign renderer expects v02_disruptive, received ${templateVersion}`);
}

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const splitCopy = (text = "") => {
  const blocks = String(text).split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  return { main: blocks[0] || text, support: blocks.slice(1).join("\n\n") };
};

function inferLayout(slide, index, total, variant) {
  if (slide.layout) return slide.layout;
  if (index === 0) return "cover";
  if (index === total - 1) return "closing";

  const role = String(slide.role || "").toLowerCase();
  if (role.includes("question")) return "question_block";

  const variantA = ["two_zone", "quote_card", "split", "full_bleed", "black_band", "vertical_type", "center_clear", "question_block"];
  const variantB = ["vertical_type", "full_bleed", "split", "quote_card", "black_band", "center_clear", "two_zone", "question_block"];
  return (variant === "B" ? variantB : variantA)[(index - 1) % 8];
}

function densityClass(text = "") {
  const length = text.replace(/\s+/g, " ").trim().length;
  if (length > 360) return "density-xl";
  if (length > 245) return "density-l";
  if (length > 150) return "density-m";
  return "density-s";
}

function pickBackground(thesis, slide, index, variant) {
  if (slide.background) return slide.background;
  const offset = variant === "B" ? 2 : 0;
  return thesis.images[(index + offset) % thesis.images.length];
}

function backgroundFrame(index, variant) {
  const positionsA = ["50% 50%", "38% 52%", "68% 48%", "48% 58%", "30% 50%", "72% 46%", "44% 42%", "60% 58%"];
  const positionsB = ["64% 48%", "42% 56%", "74% 52%", "35% 48%", "58% 44%", "28% 54%", "70% 58%", "46% 45%"];
  const zooms = [104, 110, 106, 114, 108, 112, 105, 109];
  const sequence = variant === "B" ? positionsB : positionsA;
  return {
    position: sequence[index % sequence.length],
    size: `${zooms[index % zooms.length]}% auto`
  };
}

function css(fonts) {
  return `
@font-face{font-family:IALOFutura;src:url('${fonts.futura}') format('woff');font-weight:800}
@font-face{font-family:IALOLyonText;src:url('${fonts.lyonText}') format('woff')}
@font-face{font-family:IALOLyonDisplay;src:url('${fonts.lyonDisplay}') format('woff')}
:root{--cream:#EEE9E0;--black:#1A1A1A;--orange:#FF5000;--violet:#50235A}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden}body{background:#111;color:var(--cream)}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:#111}
.bg{position:absolute;inset:0;background-repeat:no-repeat;background-color:#111;filter:saturate(.92) contrast(1.04)}
.counter{position:absolute;z-index:30;right:68px;top:68px;border-radius:40px;padding:12px 22px 10px;background:rgba(26,26,26,.88);color:var(--cream);font:800 28px/1 IALOFutura,Impact,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.16)}
.counter-light{background:var(--cream);color:var(--black)}
.logo{position:absolute;z-index:30;left:76px;bottom:64px;width:74px;height:auto;filter:drop-shadow(0 2px 10px rgba(0,0,0,.45))}
.text,.support{position:absolute;z-index:20;white-space:pre-line}.text{font-family:IALOLyonDisplay,Georgia,serif}.support{font-family:IALOLyonText,Georgia,serif}
.accent{position:absolute;z-index:24;background:var(--orange);width:76px;height:8px}.rule{position:absolute;z-index:20;height:2px;background:rgba(238,233,224,.72)}

.layout-cover .text{left:76px;top:50%;transform:translateY(-50%);width:880px;font-size:88px;line-height:.98;text-shadow:0 4px 24px rgba(0,0,0,.88)}
.layout-cover .accent{left:76px;top:75%}
.layout-cover.density-m .text{font-size:74px}.layout-cover.density-l .text{font-size:62px;line-height:1.02}.layout-cover.density-xl .text{font-size:52px;line-height:1.06}

.layout-two_zone .top{position:absolute;z-index:10;left:0;top:0;width:100%;height:520px;background:var(--cream)}
.layout-two_zone .text{left:76px;top:130px;width:850px;color:var(--black);font-size:67px;line-height:1.02}
.layout-two_zone .support{left:76px;top:755px;width:790px;font-size:43px;line-height:1.12;text-shadow:0 3px 18px rgba(0,0,0,.9)}
.layout-two_zone .accent{left:76px;top:590px}
.layout-two_zone.density-m .top{height:640px}.layout-two_zone.density-m .text{font-size:54px}.layout-two_zone.density-m .accent{top:700px}
.layout-two_zone.density-l .top,.layout-two_zone.density-xl .top{height:790px}.layout-two_zone.density-l .text,.layout-two_zone.density-xl .text{font-size:43px;line-height:1.08}.layout-two_zone.density-l .accent,.layout-two_zone.density-xl .accent{top:850px}

.layout-quote_card .card{position:absolute;z-index:12;left:92px;top:180px;width:820px;min-height:920px;border-radius:18px;background:var(--cream);padding:105px 60px 82px;color:var(--black);box-shadow:0 26px 70px rgba(0,0,0,.18)}
.layout-quote_card .bar{position:absolute;z-index:22;left:92px;top:180px;width:18px;height:920px;background:var(--orange)}
.layout-quote_card .text{position:relative;color:var(--black);font-size:60px;line-height:1.08}.layout-quote_card .support{position:relative;margin-top:42px;color:var(--black);font-size:38px;line-height:1.14}
.layout-quote_card.density-m .text{font-size:50px}.layout-quote_card.density-l .text,.layout-quote_card.density-xl .text{font-size:41px;line-height:1.12}.layout-quote_card.density-l .support,.layout-quote_card.density-xl .support{font-size:31px}

.layout-split .panel{position:absolute;z-index:10;left:0;top:0;width:570px;height:100%;background:var(--black)}
.layout-split .text{left:70px;top:235px;width:440px;font-size:62px;line-height:1.02}.layout-split .support{left:70px;top:770px;width:430px;font-size:36px;line-height:1.14}.layout-split .accent{left:70px;top:680px}
.layout-split.density-m .text{font-size:50px;line-height:1.08}.layout-split.density-l .text,.layout-split.density-xl .text{font-size:39px;line-height:1.1}.layout-split.density-l .support,.layout-split.density-xl .support{font-size:29px}

.layout-full_bleed .text{left:76px;top:300px;width:860px;font-size:70px;line-height:1.03;text-shadow:0 4px 24px rgba(0,0,0,.92)}
.layout-full_bleed .support{left:76px;top:840px;width:790px;font-size:38px;line-height:1.14;text-shadow:0 3px 18px rgba(0,0,0,.92)}
.layout-full_bleed .accent{left:76px;top:235px}.layout-full_bleed .rule{left:76px;bottom:185px;width:390px}
.layout-full_bleed.density-m .text{font-size:56px}.layout-full_bleed.density-l .text,.layout-full_bleed.density-xl .text{font-size:44px;line-height:1.1}

.layout-black_band .band{position:absolute;z-index:10;left:0;top:250px;width:100%;height:760px;background:var(--black)}
.layout-black_band .text{left:76px;top:350px;width:880px;font-size:67px;line-height:1.03}.layout-black_band .support{left:76px;top:800px;width:800px;font-size:37px;line-height:1.14}.layout-black_band .accent{left:76px;top:1060px}
.layout-black_band.density-m .text{font-size:54px}.layout-black_band.density-l .text,.layout-black_band.density-xl .text{font-size:43px;line-height:1.1}

.layout-vertical_type .panel{position:absolute;z-index:10;right:68px;top:120px;width:700px;min-height:1030px;background:var(--cream);border-radius:16px;box-shadow:0 26px 70px rgba(0,0,0,.16)}
.layout-vertical_type .text{right:125px;top:245px;width:590px;color:var(--black);font-size:68px;line-height:1.02}.layout-vertical_type .support{right:125px;top:790px;width:590px;color:var(--black);font-size:36px;line-height:1.14}.layout-vertical_type .accent{right:639px;top:185px;width:58px}
.layout-vertical_type.density-m .text{font-size:54px}.layout-vertical_type.density-l .text,.layout-vertical_type.density-xl .text{font-size:42px;line-height:1.1}.layout-vertical_type.density-l .support,.layout-vertical_type.density-xl .support{font-size:30px}

.layout-center_clear .text{left:130px;top:50%;transform:translateY(-50%);width:820px;text-align:center;font-size:76px;line-height:1.02;text-shadow:0 4px 24px rgba(0,0,0,.92)}
.layout-center_clear .accent{left:502px;top:76%;width:76px}.layout-center_clear.density-m .text{font-size:60px}.layout-center_clear.density-l .text,.layout-center_clear.density-xl .text{font-size:46px;line-height:1.1}

.layout-question_block .card{position:absolute;z-index:10;left:54px;top:150px;width:972px;min-height:1000px;border-radius:22px;background:var(--black);box-shadow:0 28px 80px rgba(0,0,0,.18)}
.layout-question_block .text{left:100px;top:280px;width:820px;font-size:68px;line-height:1.03}.layout-question_block .support{left:100px;top:820px;width:780px;font-size:36px;line-height:1.14}.layout-question_block .accent{left:100px;top:1040px}
.layout-question_block.density-m .text{font-size:54px}.layout-question_block.density-l .text,.layout-question_block.density-xl .text{font-size:43px;line-height:1.1}

.layout-closing{background:var(--cream);color:var(--black)}.layout-closing .bg{top:auto;bottom:0;height:465px;filter:saturate(.92) contrast(1.04)}
.layout-closing .text{left:76px;top:225px;width:900px;color:var(--black);font-size:70px;line-height:1.03}.layout-closing .support{left:76px;top:650px;width:820px;color:var(--black);font-size:35px;line-height:1.14}.layout-closing .accent{left:76px;top:590px}
.layout-closing.density-m .text{font-size:57px}.layout-closing.density-l .text,.layout-closing.density-xl .text{font-size:44px;line-height:1.1}
`;
}

function slideMarkup({ slide, index, total, layout, backgroundUrl, frame, logoUrl, fonts }) {
  const copy = splitCopy(slide.text);
  const density = densityClass(slide.text);
  const bg = `<div class="bg" style="background-image:url('${backgroundUrl}');background-position:${frame.position};background-size:${frame.size}"></div>`;
  const lightCounter = ["two_zone", "vertical_type", "closing"].includes(layout) ? " counter-light" : "";
  const counter = `<div class="counter${lightCounter}">${index + 1}/${total}</div>`;
  const logo = `<img class="logo" src="${logoUrl}" alt="IALO"/>`;
  const main = esc(copy.main);
  const support = esc(copy.support);
  const supportMarkup = support ? `<div class="support">${support}</div>` : "";

  let body = `${bg}${counter}<div class="accent"></div><div class="text">${main}</div>${supportMarkup}${logo}`;

  if (layout === "two_zone") body = `${bg}<div class="top"></div>${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;
  if (layout === "quote_card") body = `${bg}${counter}<div class="card"><div class="text">${main}</div>${supportMarkup}</div><div class="bar"></div>${logo}`;
  if (layout === "split") body = `${bg}<div class="panel"></div>${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;
  if (layout === "full_bleed") body = `${bg}${counter}<div class="text">${main}</div><div class="accent"></div><div class="rule"></div>${supportMarkup}${logo}`;
  if (layout === "black_band") body = `${bg}<div class="band"></div>${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;
  if (layout === "vertical_type") body = `${bg}<div class="panel"></div>${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;
  if (layout === "center_clear") body = `${bg}${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;
  if (layout === "question_block") body = `${bg}<div class="card"></div>${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;
  if (layout === "closing") body = `${bg}${counter}<div class="text">${main}</div><div class="accent"></div>${supportMarkup}${logo}`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css(fonts)}</style></head><body><article class="slide layout-${layout} ${density}">${body}</article></body></html>`;
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
  if (!Array.isArray(content.slides) || content.slides.length < 5) throw new Error(`${file} needs at least 5 slides`);

  const outDir = path.join(outputRoot, content.content_id);
  await fs.mkdir(outDir, { recursive: true });

  for (const [index, slide] of content.slides.entries()) {
    const layout = inferLayout(slide, index, content.slides.length, content.variant);
    const background = pickBackground(thesis, slide, index, content.variant);
    const frame = backgroundFrame(index, content.variant);
    const bgPath = path.resolve(thesis.folder, background);
    try { await fs.access(bgPath); } catch { throw new Error(`Missing background: ${bgPath}`); }

    const html = slideMarkup({
      slide,
      index,
      total: content.slides.length,
      layout,
      backgroundUrl: pathToFileURL(bgPath).href,
      frame,
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
    await page.locator(".slide").screenshot({ path: path.join(outDir, `slide-${String(index + 1).padStart(2, "0")}.png`) });
  }

  await fs.writeFile(path.join(outDir, "metadata.json"), `${JSON.stringify({ ...content, template: templateVersion }, null, 2)}\n`);
  campaignIndex.push({ content_id: content.content_id, week: content.week, variant: content.variant, publish_at: content.publish_at, slides: content.slides.length, template: templateVersion });
}

await browser.close();
await fs.rm(tmpDir, { recursive: true, force: true });
await fs.writeFile(path.join(outputRoot, "campaign-index.json"), `${JSON.stringify({ campaign_id: config.campaign_id, template: templateVersion, rendered_at: new Date().toISOString(), items: campaignIndex }, null, 2)}\n`);
console.log(`Rendered ${campaignIndex.length} carousels with ${templateVersion} to ${outputRoot}`);
