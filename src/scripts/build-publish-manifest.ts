import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { slugify } from "../lib/slugify.js";
import type { PublishManifest, PublishPost } from "../types/publish.js";

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

const carouselSchema = z.object({
  title: z.string(),
  caption: z.string(),
  cta: z.string().optional(),
  slides: z.array(z.object({ number: z.number(), text: z.string(), type: z.string() }))
});

const publishingConfigSchema = z.object({
  timezone: z.string(),
  utcOffset: z.string(),
  defaultPlatformsByFormat: z.record(z.array(z.string())),
  scheduleByFormat: z.record(z.object({ dayOffset: z.number(), time: z.string() })),
  videoFormats: z.array(z.string()),
  staticImageFormats: z.array(z.string())
});

const manualAssetsSchema = z.object({
  items: z.array(z.object({
    pieceIndex: z.number().optional(),
    format: z.string().optional(),
    mediaUrl: z.string().url(),
    platforms: z.array(z.string()).optional(),
    caption: z.string().optional()
  }))
});

type Piece = z.infer<typeof pieceSchema>;
type ManualAssets = z.infer<typeof manualAssetsSchema>["items"];

const runId = process.env.PUBLISH_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const thesis = process.env.THESIS || "cambio-adentro";
const publicAssetBaseUrl = (process.env.PUBLIC_ASSET_BASE_URL || "").replace(/\/$/, "");
const publishStartDate = process.env.PUBLISH_START_DATE || new Date().toISOString().slice(0, 10);
const weeklyPlanPath = process.env.WEEKLY_PLAN_PATH || "output/weekly-plan.json";
const carouselPath = process.env.CAROUSEL_COPY_PATH || "output/carousel-copy.json";
const outputManifestPath = process.env.PUBLISH_MANIFEST_PATH || "output/publish-manifest.json";
const outputBlotatoPayloadPath = process.env.BLOTATO_PAYLOAD_PATH || "output/blotato-payload.json";
const publicBuildDir = process.env.PUBLIC_BUILD_DIR || `public-assets/generated/${runId}`;
const manualVideoAssetsPath = process.env.MANUAL_VIDEO_ASSETS_PATH || "manual-assets/video-assets.json";

if (!publicAssetBaseUrl) {
  throw new Error("Missing PUBLIC_ASSET_BASE_URL. Example: https://raw.githubusercontent.com/owner/repo/published-assets");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function copyIfExists(from: string, to: string): Promise<void> {
  if (!(await fileExists(from))) {
    return;
  }

  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.cp(from, to, { recursive: true });
}

function normalizeFormat(format: string): string {
  return format.trim().toLowerCase();
}

function pickByFormat<T>(record: Record<string, T>, format: string): T | undefined {
  return record[format] ?? record[normalizeFormat(format)];
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function scheduledAt(date: string, dayOffset: number, time: string, utcOffset: string): string {
  return `${addDays(date, dayOffset)}T${time}:00${utcOffset}`;
}

function textFromPiece(piece: Piece): string {
  return [piece.title, piece.hook, piece.cta]
    .filter(Boolean)
    .join("\n\n");
}

async function listPngUrls(dir: string, urlPrefix: string): Promise<string[]> {
  if (!(await fileExists(dir))) {
    return [];
  }

  const files = await fs.readdir(dir);
  return files
    .filter((file) => file.endsWith(".png"))
    .sort()
    .map((file) => `${urlPrefix}/${file}`);
}

function findManualVideoAsset(manualAssets: ManualAssets, piece: Piece, index: number) {
  const normalized = normalizeFormat(piece.format);
  return manualAssets.find((asset) => {
    if (asset.pieceIndex === index + 1) return true;
    if (asset.format && normalizeFormat(asset.format) === normalized) return true;
    return false;
  });
}

const weeklyPlan = weeklyPlanSchema.parse(await readJson(weeklyPlanPath));
const carousel = carouselSchema.parse(await readJson(carouselPath));
const publishingConfig = publishingConfigSchema.parse(await readJson("src/config/publishing.json"));
const timezone = process.env.PUBLISH_TIMEZONE || publishingConfig.timezone;
const utcOffset = process.env.PUBLISH_UTC_OFFSET || publishingConfig.utcOffset;
const assetRootUrl = `${publicAssetBaseUrl}/generated/${runId}`;
const videoFormats = new Set(publishingConfig.videoFormats.map(normalizeFormat));
const staticFormats = new Set(publishingConfig.staticImageFormats.map(normalizeFormat));

const manualAssets = (await fileExists(manualVideoAssetsPath))
  ? manualAssetsSchema.parse(await readJson(manualVideoAssetsPath)).items
  : [];

await fs.rm(publicBuildDir, { recursive: true, force: true });
await fs.mkdir(publicBuildDir, { recursive: true });
await copyIfExists("output/carousel", path.join(publicBuildDir, "carousel"));
await copyIfExists("output/static-cards", path.join(publicBuildDir, "static-cards"));
await copyIfExists(weeklyPlanPath, path.join(publicBuildDir, "weekly-plan.json"));
await copyIfExists(carouselPath, path.join(publicBuildDir, "carousel-copy.json"));

const carouselUrls = await listPngUrls("output/carousel", `${assetRootUrl}/carousel`);
const staticCardIndexPath = "output/static-cards/index.json";
const staticCardIndex = (await fileExists(staticCardIndexPath))
  ? await readJson<{ rendered: Array<{ index: number; format: string; file: string }> }>(staticCardIndexPath)
  : { rendered: [] };

const posts: PublishPost[] = weeklyPlan.pieces.map((piece, index) => {
  const formatKey = normalizeFormat(piece.format);
  const schedule = pickByFormat(publishingConfig.scheduleByFormat, piece.format) || { dayOffset: index, time: "10:00" };
  const platforms = pickByFormat(publishingConfig.defaultPlatformsByFormat, piece.format) || ["instagram"];
  const id = `ialo-${runId}-piece-${String(index + 1).padStart(2, "0")}-${slugify(piece.format)}`;
  const basePost = {
    id,
    format: piece.format,
    contentType: piece.content_type,
    platforms,
    scheduledAt: scheduledAt(publishStartDate, schedule.dayOffset, schedule.time, utcOffset),
    timezone,
    title: piece.title,
    cta: piece.cta,
    source: "generated" as const,
    metadata: {
      day: piece.day,
      pieceIndex: index + 1,
      thesis,
      weekGoal: weeklyPlan.week_goal
    }
  };

  if (formatKey === "carrusel") {
    return {
      ...basePost,
      status: carouselUrls.length > 0 ? "ready" : "draft",
      type: "carousel",
      caption: carousel.caption,
      text: carousel.caption,
      mediaUrls: carouselUrls
    };
  }

  if (videoFormats.has(formatKey)) {
    const manualAsset = findManualVideoAsset(manualAssets, piece, index);

    return {
      ...basePost,
      status: manualAsset ? "ready" : "needs_manual_video",
      type: "video",
      platforms: manualAsset?.platforms || platforms,
      caption: manualAsset?.caption || textFromPiece(piece),
      text: manualAsset?.caption || textFromPiece(piece),
      mediaUrls: manualAsset ? [manualAsset.mediaUrl] : []
    };
  }

  const staticCard = staticCardIndex.rendered.find((item) => item.index === index + 1);
  const staticCardUrl = staticCard ? `${assetRootUrl}/static-cards/${staticCard.file}` : undefined;
  const isTextOnly = formatKey.includes("hilo");
  const mediaUrls = staticCardUrl && !isTextOnly ? [staticCardUrl] : [];

  return {
    ...basePost,
    status: "ready",
    type: staticFormats.has(formatKey) && mediaUrls.length > 0 ? "image" : "text",
    caption: textFromPiece(piece),
    text: textFromPiece(piece),
    mediaUrls
  };
});

const manifest: PublishManifest = {
  runId,
  thesis,
  generatedAt: new Date().toISOString(),
  publicAssetBaseUrl,
  assetRootUrl,
  timezone,
  posts
};

const blotatoPayload = {
  source: "ialo-content-engine",
  runId,
  generatedAt: manifest.generatedAt,
  posts: posts
    .filter((post) => post.status === "ready")
    .map((post) => ({
      externalId: post.id,
      platforms: post.platforms,
      type: post.type,
      scheduledAt: post.scheduledAt,
      text: post.text,
      caption: post.caption,
      mediaUrls: post.mediaUrls,
      metadata: post.metadata
    }))
};

await fs.mkdir(path.dirname(outputManifestPath), { recursive: true });
await fs.writeFile(outputManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(outputBlotatoPayloadPath, `${JSON.stringify(blotatoPayload, null, 2)}\n`);
await fs.writeFile(path.join(publicBuildDir, "publish-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(path.join(publicBuildDir, "blotato-payload.json"), `${JSON.stringify(blotatoPayload, null, 2)}\n`);

console.log(`Publish manifest written to ${outputManifestPath}`);
console.log(`Blotato payload written to ${outputBlotatoPayloadPath}`);
console.log(`Public asset package built at ${publicBuildDir}`);
console.log(`Ready posts: ${blotatoPayload.posts.length}`);
console.log(`Needs manual video: ${posts.filter((post) => post.status === "needs_manual_video").length}`);
