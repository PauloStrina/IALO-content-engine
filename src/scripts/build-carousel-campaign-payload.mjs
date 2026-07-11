import fs from "node:fs/promises";
import path from "node:path";

const campaignDir = process.env.CAMPAIGN_DIR || "content/campaigns/2026-07-14-eight-weeks";
const contentDir = path.join(campaignDir, "carousels");
const campaignId = path.basename(campaignDir);
const publicAssetBaseUrl = (process.env.PUBLIC_ASSET_BASE_URL || "").replace(/\/$/, "");
const renderedRoot = process.env.CAMPAIGN_OUTPUT_DIR || `public-assets/campaigns/${campaignId}`;
const outputManifest = process.env.CAMPAIGN_MANIFEST_PATH || "output/campaign-manifest.json";
const outputPayload = process.env.BLOTATO_PAYLOAD_PATH || "output/blotato-payload.json";

if (!publicAssetBaseUrl) {
  throw new Error("Missing PUBLIC_ASSET_BASE_URL");
}

const config = JSON.parse(await fs.readFile(path.join(campaignDir, "campaign.config.json"), "utf8"));
const files = (await fs.readdir(contentDir)).filter((file) => file.endsWith(".json")).sort();
const carousels = [];

for (const file of files) {
  const content = JSON.parse(await fs.readFile(path.join(contentDir, file), "utf8"));
  const slideDir = path.join(renderedRoot, content.content_id);
  const slideFiles = (await fs.readdir(slideDir)).filter((name) => /^slide-\d+\.png$/.test(name)).sort();

  if (slideFiles.length !== content.slides.length) {
    throw new Error(`${content.content_id}: expected ${content.slides.length} PNGs, found ${slideFiles.length}`);
  }

  const mediaUrls = slideFiles.map((name) => `${publicAssetBaseUrl}/campaigns/${campaignId}/${content.content_id}/${name}`);
  carousels.push({
    id: content.content_id,
    status: content.approval?.status || "pending_human_approval",
    week: content.week,
    variant: content.variant,
    thesis_id: content.thesis_id,
    scheduledAt: content.publish_at,
    timezone: config.timezone,
    caption: content.caption,
    mediaUrls,
    metadata: {
      campaign_id: campaignId,
      title: content.title,
      variant_id: content.variant_id,
      template: config.visual_system.template_version,
      source_file: file
    }
  });
}

carousels.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

if (carousels.length !== config.cadence.total_posts) {
  throw new Error(`Expected ${config.cadence.total_posts} posts, found ${carousels.length}`);
}

const uniqueDates = new Set(carousels.map((item) => item.scheduledAt));
if (uniqueDates.size !== carousels.length) {
  throw new Error("Duplicate scheduledAt values in campaign");
}

const manifest = {
  campaign_id: campaignId,
  generated_at: new Date().toISOString(),
  timezone: config.timezone,
  dry_run_required: config.approval_policy.dry_run_required,
  human_review_required: config.approval_policy.human_review_required_before_blotato,
  posts: carousels
};

const payload = {
  source: "ialo-content-engine",
  runId: campaignId,
  generatedAt: manifest.generated_at,
  posts: carousels.map((item) => ({
    externalId: item.id,
    platforms: ["instagram"],
    type: "carousel",
    scheduledAt: item.scheduledAt,
    caption: item.caption,
    text: item.caption,
    mediaUrls: item.mediaUrls,
    metadata: item.metadata
  }))
};

await fs.mkdir(path.dirname(outputManifest), { recursive: true });
await fs.writeFile(outputManifest, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(outputPayload, `${JSON.stringify(payload, null, 2)}\n`);
await fs.writeFile(path.join(renderedRoot, "campaign-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(path.join(renderedRoot, "blotato-payload.json"), `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Campaign manifest: ${outputManifest}`);
console.log(`Blotato payload: ${outputPayload}`);
console.log(`Posts ready for dry run: ${payload.posts.length}`);
