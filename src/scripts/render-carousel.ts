import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { z } from "zod";

const slideSchema = z.object({
  number: z.number(),
  type: z.enum(["cover", "body", "question", "closing"]),
  text: z.string()
});

const carouselSchema = z.object({
  title: z.string(),
  caption: z.string(),
  slides: z.array(slideSchema),
  cta: z.string()
});

const inputPath = process.env.INPUT_PATH || "output/carousel-copy.json";
const templateKey = process.env.TEMPLATE_KEY || "carousel-base";
const outputDir = process.env.OUTPUT_DIR || "output/carousel";
const templatePath = path.resolve(`design/templates/${templateKey}/index.html`);

const raw = await fs.readFile(inputPath, "utf-8");
const carousel = carouselSchema.parse(JSON.parse(raw));

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1
});

for (const slide of carousel.slides) {
  const url = new URL(pathToFileURL(templatePath));
  url.searchParams.set("text", slide.text);
  url.searchParams.set("type", slide.type);
  url.searchParams.set("number", `${slide.number}/${carousel.slides.length}`);

  await page.goto(url.toString());
  await page.screenshot({
    path: path.join(outputDir, `slide-${String(slide.number).padStart(2, "0")}.png`),
    type: "png"
  });
}

await browser.close();

await fs.writeFile(
  path.join(outputDir, "metadata.json"),
  `${JSON.stringify({ title: carousel.title, caption: carousel.caption, cta: carousel.cta, templateKey }, null, 2)}\n`
);

console.log(`Rendered ${carousel.slides.length} slides at ${outputDir}`);
