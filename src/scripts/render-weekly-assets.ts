import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { z } from "zod";
import { slugify } from "../lib/slugify.js";

const pieceSchema = z.object({
  day: z.string().optional(),
  format: z.string(),
  content_type: z.string().optional(),
  title: z.string().optional(),
  hook: z.string().optional(),
  cta: z.string().optional()
});

const weeklyPlanSchema = z.object({
  thesis: z.string().optional(),
  week_goal: z.string().optional(),
  pieces: z.array(pieceSchema)
});

const inputPath = process.env.WEEKLY_PLAN_PATH || "output/weekly-plan.json";
const outputDir = process.env.STATIC_ASSETS_DIR || "output/static-cards";
const templatePath = path.resolve("design/templates/static-card/index.html");
const staticFormats = new Set(
  (process.env.STATIC_CARD_FORMATS || "post frase,stories,hilo X,hilo x")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

const raw = await fs.readFile(inputPath, "utf-8");
const weeklyPlan = weeklyPlanSchema.parse(JSON.parse(raw));

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1
});

const rendered: Array<{ index: number; format: string; file: string }> = [];

for (const [index, piece] of weeklyPlan.pieces.entries()) {
  if (!staticFormats.has(piece.format)) {
    continue;
  }

  const title = piece.title || piece.hook || piece.format;
  const fileName = `piece-${String(index + 1).padStart(2, "0")}-${slugify(piece.format)}.png`;
  const url = new URL(pathToFileURL(templatePath));
  url.searchParams.set("format", piece.format);
  url.searchParams.set("contentType", piece.content_type || "");
  url.searchParams.set("title", title);
  url.searchParams.set("hook", piece.hook || "");
  url.searchParams.set("cta", piece.cta || "");

  await page.goto(url.toString());
  await page.screenshot({
    path: path.join(outputDir, fileName),
    type: "png"
  });

  rendered.push({ index: index + 1, format: piece.format, file: fileName });
}

await browser.close();

await fs.writeFile(
  path.join(outputDir, "index.json"),
  `${JSON.stringify({ rendered }, null, 2)}\n`
);

console.log(`Rendered ${rendered.length} weekly static assets at ${outputDir}`);
