import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

const payloadPath = process.env.BLOTATO_PAYLOAD_PATH || "output/blotato-payload.json";
const responsePath = process.env.BLOTATO_RESPONSE_PATH || "output/blotato-response.json";
const apiKey = process.env.BLOTATO_API_KEY;
const apiBaseUrl = (process.env.BLOTATO_BASE_URL || "https://backend.blotato.com/v2").replace(/\/$/, "");
const uploadMediaFirst = process.env.BLOTATO_UPLOAD_MEDIA === "true";
const delaySeconds = Number(process.env.BLOTATO_DELAY_SECONDS || 5);
const maxAttempts = Number(process.env.BLOTATO_MAX_ATTEMPTS || 3);

type BlotatoTarget = {
  accountId: string;
  platform: string;
  targetType?: string;
  pageId?: string;
};

type BlotatoPayloadPost = {
  externalId: string;
  platforms: string[];
  type: string;
  scheduledAt: string;
  text?: string;
  caption?: string;
  mediaUrls?: string[];
  metadata?: Record<string, unknown>;
};

type BlotatoPayload = {
  source?: string;
  runId?: string;
  generatedAt?: string;
  posts: BlotatoPayloadPost[];
};

type PublishResult = {
  externalId: string;
  platform: string;
  status: "posted" | "skipped" | "failed";
  request?: unknown;
  response?: unknown;
  error?: string;
};

if (!apiKey) {
  throw new Error("Missing BLOTATO_API_KEY");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeKey(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function readTargets(): Record<string, BlotatoTarget> {
  const fromJson = process.env.BLOTATO_TARGETS_JSON;

  if (fromJson?.trim()) {
    return JSON.parse(fromJson) as Record<string, BlotatoTarget>;
  }

  return {};
}

function targetFromEnv(platformKey: string): BlotatoTarget | undefined {
  const key = normalizeKey(platformKey);
  const accountId = process.env[`BLOTATO_ACCOUNT_${key}`];

  if (!accountId) {
    return undefined;
  }

  return {
    accountId,
    platform: process.env[`BLOTATO_PLATFORM_${key}`] || platformKey,
    targetType: process.env[`BLOTATO_TARGET_TYPE_${key}`],
    pageId: process.env[`BLOTATO_PAGE_ID_${key}`]
  };
}

function resolveTarget(platformKey: string, targets: Record<string, BlotatoTarget>): BlotatoTarget | undefined {
  return targets[platformKey] || targets[platformKey.toLowerCase()] || targetFromEnv(platformKey);
}

function toUtcIso(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid scheduledAt date: ${value}`);
  }

  return date.toISOString().replace(".000Z", "Z");
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function postToBlotato<T>(pathName: string, body: unknown): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${apiBaseUrl}${pathName}`, {
      method: "POST",
      headers: {
        "blotato-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    const parsed = (() => {
      try {
        return JSON.parse(text) as T;
      } catch {
        return { raw: text } as T;
      }
    })();

    if (response.ok) {
      await sleep(delaySeconds * 1000);
      return parsed;
    }

    lastError = new Error(`Blotato HTTP ${response.status}: ${text.slice(0, 600)}`);

    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === maxAttempts) {
      throw lastError;
    }

    await sleep(delaySeconds * attempt * 1000);
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown Blotato request error");
}

function validateBlotatoResponse(response: unknown): void {
  if (!response) {
    throw new Error("Empty Blotato response");
  }

  const serialized = JSON.stringify(response).toLowerCase();
  const errorMarkers = ["error", "failed", "invalid", "unauthorized", "forbidden", "rate limit", "too many requests"];

  const marker = errorMarkers.find((item) => serialized.includes(item));

  if (marker) {
    throw new Error(`Blotato returned ${marker}: ${JSON.stringify(response)}`);
  }
}

async function uploadMediaFromUrl(url: string): Promise<string> {
  const response = await postToBlotato<{ url?: string; id?: string }>("/media", { url });

  if (!response.url) {
    throw new Error(`Blotato media upload did not return url: ${JSON.stringify(response)}`);
  }

  return response.url;
}

async function prepareMediaUrls(mediaUrls: string[]): Promise<string[]> {
  if (!uploadMediaFirst) {
    return mediaUrls;
  }

  const prepared: string[] = [];

  for (const mediaUrl of mediaUrls) {
    prepared.push(await uploadMediaFromUrl(mediaUrl));
  }

  return prepared;
}

function buildPostRequest(post: BlotatoPayloadPost, platformKey: string, target: BlotatoTarget, mediaUrls: string[]) {
  const platform = target.platform;
  const text = post.caption || post.text || "";
  const targetPayload: Record<string, string> = {
    targetType: target.targetType || platform
  };

  if (target.pageId) {
    targetPayload.pageId = String(target.pageId);
  }

  return {
    post: {
      accountId: String(target.accountId),
      name: `${post.externalId}_${platformKey}`,
      content: {
        text,
        mediaUrls,
        platform
      },
      target: targetPayload
    },
    scheduledTime: toUtcIso(post.scheduledAt)
  };
}

const payload = await readJson<BlotatoPayload>(payloadPath);
const targets = readTargets();
const results: PublishResult[] = [];

for (const post of payload.posts) {
  for (const platformKey of post.platforms) {
    const target = resolveTarget(platformKey, targets);

    if (!target) {
      results.push({
        externalId: post.externalId,
        platform: platformKey,
        status: "failed",
        error: `Missing Blotato target for platform '${platformKey}'. Set BLOTATO_TARGETS_JSON or BLOTATO_ACCOUNT_${normalizeKey(platformKey)}.`
      });
      continue;
    }

    try {
      const mediaUrls = await prepareMediaUrls(post.mediaUrls || []);
      const request = buildPostRequest(post, platformKey, target, mediaUrls);
      const response = await postToBlotato<unknown>("/posts", request);
      validateBlotatoResponse(response);

      results.push({
        externalId: post.externalId,
        platform: platformKey,
        status: "posted",
        request,
        response
      });
    } catch (error) {
      results.push({
        externalId: post.externalId,
        platform: platformKey,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

const output = {
  mode: "blotato-native-posts-api",
  apiBaseUrl,
  uploadMediaFirst,
  runId: payload.runId,
  source: payload.source || "ialo-content-engine",
  generatedAt: new Date().toISOString(),
  sent: results.filter((result) => result.status === "posted").length,
  failed: results.filter((result) => result.status === "failed").length,
  results
};

await writeJson(responsePath, output);
console.log(JSON.stringify(output, null, 2));

if (output.failed > 0) {
  process.exit(1);
}
