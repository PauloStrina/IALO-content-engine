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
const files = (await fs.readdir(contentDir)).filter((file) => file.endsWith(".json")).sort();

if (files.length !== config.cadence.total_posts) {
  throw new Error(`Expected ${config.cadence.total_posts} carousels, found ${files.length}`);
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
  if (role.includes("question")) return "question";
  const a = ["poetic", "split", "quote", "poetic", "reframe", "distinction", "center"];
  const b = ["poetic", "question", "split", "quote", "reframe", "center", "distinction"];
  return (variant === "B" ? b : a)[(index - 1) % 7];
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

function css(fonts) {
  return `
@font-face{font-family:IALOFutura;src:url('${fonts.futura}') format('woff');font-weight:800}
@font-face{font-family:IALOLyonText;src:url('${fonts.lyonText}') format('woff')}
@font-face{font-family:IALOLyonDisplay;src:url('${fonts.lyonDisplay}') format('woff')}
:root{--cream:#EEE9E0;--black:#1A1A1A;--orange:#FF5000;--violet:#50235A}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden}body{background:#111;color:var(--cream)}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:#111}
.bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(.76) contrast(1.10) brightness(.82)}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.65),rgba(0,0,0,.20) 72%,rgba(0,0,0,.42)),linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.48))}
.counter{position:absolute;z-index:20;left:76px;top:70px;border:1px solid rgba(238,233,224,.45);border-radius:40px;padding:11px 20px 9px;font:800 28px/1 IALOFutura,Impact,sans-serif}
.logo{position:absolute;z-index:20;left:76px;bottom:66px;width:74px;height:auto}
.text,.support{position:absolute;z-index:12;white-space:pre-line}.text{font-family:IALOLyonDisplay,Georgia,serif}.support{font-family:IALOLyonText,Georgia,serif}.accent{position:absolute;z-index:14;background:var(--orange);width:76px;height:8px}
.layout-cover .text{left:72px;top:245px;width:900px;font:800 104px/.82 IALOFutura,Impact,sans-serif;text-transform:uppercase;letter-spacing:-.025em}.layout-cover .accent{left:76px;top:980px}.layout-cover.density-m .text,.layout-cover.density-l .text,.layout-cover.density-xl .text{font-size:84px;line-height:.9}
.layout-poetic .text{left:90px;top:300px;width:850px;font-size:68px;line-height:1.03}.layout-poetic .accent{left:90px;top:230px;width:52px}.layout-poetic.density-m .text{font-size:58px}.layout-poetic.density-l .text{font-size:48px;line-height:1.08}.layout-poetic.density-xl .text{font-size:40px;line-height:1.12}
.layout-split .panel{position:absolute;z-index:8;left:0;top:0;width:570px;height:100%;background:rgba(26,26,26,.94)}.layout-split .text{left:70px;top:250px;width:445px;font-size:66px;line-height:1}.layout-split .support{left:70px;top:710px;width:430px;font-size:39px;line-height:1.13}.layout-split .accent{left:70px;top:620px}.layout-split.density-l .text,.layout-split.density-xl .text{font-size:49px;line-height:1.07}.layout-split.density-l .support,.layout-split.density-xl .support{font-size:33px}
.layout-quote .card{position:absolute;z-index:8;left:92px;top:190px;width:820px;min-height:850px;border-radius:18px;background:rgba(238,233,224,.96);padding:95px 56px;color:var(--black)}.layout-quote .bar{position:absolute;z-index:13;left:92px;top:190px;width:18px;height:850px;background:var(--orange)}.layout-quote .text{position:relative;color:var(--black);font-size:58px;line-height:1.08}.layout-quote .support{position:relative;margin-top:42px;color:var(--black);font-size:39px;line-height:1.13}.layout-quote.density-l .text,.layout-quote.density-xl .text{font-size:43px;line-height:1.12}.layout-quote.density-l .support,.layout-quote.density-xl .support{font-size:31px}
.layout-reframe .card{position:absolute;z-index:8;left:72px;top:270px;width:875px;min-height:570px;border-radius:22px;background:rgba(238,233,224,.94);padding:112px 38px 80px;color:var(--black)}.layout-reframe .text{position:relative;color:var(--black);font-size:74px;line-height:1}.layout-reframe .support{position:relative;margin-top:55px;color:var(--black);font-size:42px;line-height:1.12}.layout-reframe .accent{left:110px;top:325px}.layout-reframe.density-l .text,.layout-reframe.density-xl .text{font-size:53px}.layout-reframe.density-l .support,.layout-reframe.density-xl .support{font-size:34px}
.layout-distinction .top{position:absolute;z-index:8;left:0;top:0;width:100%;height:410px;background:var(--cream)}.layout-distinction .text{left:76px;top:100px;width:900px;color:var(--black);font-size:70px;line-height:1}.layout-distinction .mini{position:absolute;z-index:8;left:76px;top:760px;width:760px;min-height:250px;border-radius:18px;background:rgba(26,26,26,.92);padding:82px 36px 42px}.layout-distinction .support{position:relative;font-size:44px;line-height:1.1}.layout-distinction .accent{left:112px;top:810px;width:58px}.layout-distinction.density-l .text,.layout-distinction.density-xl .text{font-size:53px}.layout-distinction.density-l .support,.layout-distinction.density-xl .support{font-size:34px}
.layout-center .text{left:130px;top:340px;width:820px;text-align:center;font-size:78px;line-height:1.02}.layout-center.density-m .text{font-size:62px}.layout-center.density-l .text,.layout-center.density-xl .text{font-size:48px;line-height:1.1}
.layout-question .accent{left:76px;top:255px}.layout-question .text{left:76px;top:335px;width:880px;font-size:70px;line-height:1.02}.layout-question.density-m .text{font-size:60px}.layout-question.density-l .text,.layout-question.density-xl .text{font-size:47px;line-height:1.1}
.layout-closing{background:var(--cream);color:var(--black)}.layout-closing .bg{top:auto;height:505px;bottom:0;filter:saturate(.72) contrast(1.08) brightness(.78)}.layout-closing .veil{display:none}.layout-closing .counter{color:var(--black);border-color:rgba(26,26,26,.3)}.layout-closing .text{left:76px;top:245px;width:900px;color:var(--black);font-size:72px;line-height:1.02}.layout-closing .support{left:76px;top:650px;width:820px;color:var(--black);font-size:36px;line-height:1.13}.layout-closing .accent{left:76px;top:590px}.layout-closing.density-m .text{font-size:60px}.layout-closing.density-l .text,.layout-closing.density-xl .text{font-size:46px;line-height:1.09}
`;
}

function slideMarkup({ slide, index, total, layout, backgroundUrl, logoUrl, fonts }) {
  const copy = splitCopy(slide.text);
  const density = densityClass(slide.text);
  const bg = `<div class="bg" style="background-image:url('${backgroundUrl}')"></div><div class="veil"></div>`;
  const counter = `<div class="counter">${index + 1}/${total}</div>`;
  const logo = `<img class="logo" src="${logoUrl}" alt="IALO"/>`;
  const main = esc(copy.main);
  const support = esc(copy.support);
  let body = `${bg}${counter}<div class="accent"></div><div class="text">${main}</div>${support ? `<div class="support">${support}</div>` : ""}${logo}`;
  if (layout === "split") body = `${bg}${counter}<div class="panel"></div><div class="text">${main}</div><div class="accent"></div>${support ? `<div class="support">${support}</div>` : ""}${logo}`;
  if (layout === "quote" || layout === "reframe") body = `${bg}${counter}<div class="card"><div class="text">${main}</div>${support ? `<div class="support">${support}</div>` : ""}</div>${layout === "quote" ? '<div class="bar"></div>' : '<div class="accent"></div>'}${logo}`;
  if (layout === "distinction") body = `${bg}${counter}<div class="top"></div><div class="text">${main}</div><div class="mini">${support ? `<div class="support">${support}</div>` : ""}</div><div class="accent"></div>${logo}`;
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
    const bgPath = path.resolve(thesis.folder, background);
    try { await fs.access(bgPath); } catch { throw new Error(`Missing background: ${bgPath}`); }
    const html = slideMarkup({
      slide,
      index,
      total: content.slides.length,
      layout,
      backgroundUrl: pathToFileURL(bgPath).href,
      logoUrl,
      fonts: fontUrls
    });
    const htmlPath = path.join(tmpDir, `${content.content_id}-${String(index + 1).padStart(2, "0")}.html`);
    await fs.writeFile(htmlPath, html);
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined))); });
    await page.locator(".slide").screenshot({ path: path.join(outDir, `slide-${String(index + 1).padStart(2, "0")}.png`) });
  }

  await fs.writeFile(path.join(outDir, "metadata.json"), `${JSON.stringify({ ...content, template: "v01_locked" }, null, 2)}\n`);
  campaignIndex.push({ content_id: content.content_id, week: content.week, variant: content.variant, publish_at: content.publish_at, slides: content.slides.length });
}

await browser.close();
await fs.rm(tmpDir, { recursive: true, force: true });
await fs.writeFile(path.join(outputRoot, "campaign-index.json"), `${JSON.stringify({ campaign_id: config.campaign_id, rendered_at: new Date().toISOString(), items: campaignIndex }, null, 2)}\n`);
console.log(`Rendered ${campaignIndex.length} carousels to ${outputRoot}`);
