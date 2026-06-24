import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.BLOTATO_API_KEY;
const apiUrl = process.env.BLOTATO_API_URL;
const payloadPath = process.env.BLOTATO_PAYLOAD_PATH || "output/blotato-payload.json";
const responsePath = process.env.BLOTATO_RESPONSE_PATH || "output/blotato-response.json";
const sendMode = process.env.BLOTATO_SEND_MODE || "batch";
const includeDrafts = process.env.BLOTATO_INCLUDE_DRAFTS === "true";

if (!apiUrl) {
  throw new Error("Missing BLOTATO_API_URL. Use the Blotato webhook/API endpoint that receives scheduled posts.");
}

const payload = JSON.parse(await fs.readFile(payloadPath, "utf-8"));
const posts = includeDrafts
  ? payload.posts
  : payload.posts?.filter((post: { status?: string }) => post.status !== "draft" && post.status !== "needs_manual_video") || payload.posts;

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "X-IALO-Run-Id": payload.runId || "unknown"
};

if (apiKey) {
  headers.Authorization = `Bearer ${apiKey}`;
}

async function postJson(body: unknown) {
  const response = await fetch(apiUrl as string, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const text = await response.text();
  const parsed = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  })();

  if (!response.ok) {
    throw new Error(`Blotato request failed: ${response.status} ${text}`);
  }

  return {
    status: response.status,
    response: parsed
  };
}

const result = sendMode === "single"
  ? {
      mode: "single",
      sent: posts.length,
      results: await Promise.all(
        posts.map((post: unknown) => postJson({
          source: payload.source || "ialo-content-engine",
          runId: payload.runId,
          post
        }))
      )
    }
  : {
      mode: "batch",
      sent: posts.length,
      result: await postJson({
        ...payload,
        posts
      })
    };

await fs.mkdir(path.dirname(responsePath), { recursive: true });
await fs.writeFile(responsePath, `${JSON.stringify(result, null, 2)}\n`);

console.log(JSON.stringify(result, null, 2));
