import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = process.env.PUBLISH_MANIFEST_PATH || "output/publish-manifest.json";
const payloadPath = process.env.BLOTATO_PAYLOAD_PATH || "output/blotato-payload.json";
const runId = process.env.PUBLISH_RUN_ID;
const publicBuildDir = process.env.PUBLIC_BUILD_DIR || (runId ? `public-assets/generated/${runId}` : undefined);
const publishStartDate = process.env.PUBLISH_START_DATE || new Date().toISOString().slice(0, 10);
const utcOffset = process.env.PUBLISH_UTC_UTC_OFFSET || process.env.PUBLISH_UTC_OFFSET || "-03:00";

const dayOffsets: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  miércoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
  sábado: 5,
  domingo: 6
};

const defaultTimesByFormat: Record<string, string> = {
  carrusel: "10:00",
  reel: "12:00",
  stories: "11:00",
  "clip podcast": "12:00",
  "post frase": "10:00",
  "hilo x": "18:00"
};

function normalize(value?: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function scheduledAt(date: string, dayOffset: number, time: string): string {
  return `${addDays(date, dayOffset)}T${time}:00${utcOffset}`;
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

let firstCarouselUsed = false;

manifest.posts = manifest.posts.map((post: any, index: number) => {
  const format = normalize(post.format);
  const day = normalize(post.metadata?.day);
  const dayOffset = dayOffsets[day] ?? index;
  const time = defaultTimesByFormat[format] || "10:00";

  const nextPost = {
    ...post,
    scheduledAt: scheduledAt(publishStartDate, dayOffset, time)
  };

  if (format === "carrusel") {
    if (firstCarouselUsed) {
      return {
        ...nextPost,
        status: "draft",
        mediaUrls: [],
        metadata: {
          ...nextPost.metadata,
          reason: "Extra carousel kept as draft because this workflow generated one carousel asset package."
        }
      };
    }

    firstCarouselUsed = true;
  }

  return nextPost;
});

const payload = {
  source: "ialo-content-engine",
  runId: manifest.runId,
  generatedAt: manifest.generatedAt,
  posts: manifest.posts
    .filter((post: any) => post.status === "ready")
    .sort((a: any, b: any) => a.scheduledAt.localeCompare(b.scheduledAt))
    .map((post: any) => ({
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

await writeJson(manifestPath, manifest);
await writeJson(payloadPath, payload);

if (publicBuildDir) {
  await writeJson(path.join(publicBuildDir, "publish-manifest.json"), manifest);
  await writeJson(path.join(publicBuildDir, "blotato-payload.json"), payload);
}

console.log(`Fixed manifest posts: ${manifest.posts.length}`);
console.log(`Ready posts: ${payload.posts.length}`);
console.log(`Draft posts: ${manifest.posts.filter((post: any) => post.status === "draft").length}`);
console.log(`Needs manual video: ${manifest.posts.filter((post: any) => post.status === "needs_manual_video").length}`);
