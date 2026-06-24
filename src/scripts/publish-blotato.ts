import "dotenv/config";
import fs from "node:fs/promises";

const apiKey = process.env.BLOTATO_API_KEY;
const apiUrl = process.env.BLOTATO_API_URL;
const payloadPath = process.env.BLOTATO_PAYLOAD_PATH || "output/blotato-payload.json";

if (!apiKey) {
  throw new Error("Missing BLOTATO_API_KEY");
}

if (!apiUrl) {
  throw new Error("Missing BLOTATO_API_URL. Keep this configurable until the final Blotato API contract is validated.");
}

const payload = JSON.parse(await fs.readFile(payloadPath, "utf-8"));

const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

if (!response.ok) {
  const error = await response.text();
  throw new Error(`Blotato request failed: ${response.status} ${error}`);
}

const data = await response.json().catch(() => ({}));
console.log(JSON.stringify(data, null, 2));
