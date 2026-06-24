export type PublishStatus = "ready" | "needs_manual_video" | "draft";

export type PublishPostType = "carousel" | "image" | "text" | "video";

export type PublishPost = {
  id: string;
  status: PublishStatus;
  format: string;
  contentType?: string;
  type: PublishPostType;
  platforms: string[];
  scheduledAt: string;
  timezone: string;
  title?: string;
  text?: string;
  caption?: string;
  cta?: string;
  mediaUrls: string[];
  source: "generated" | "manual";
  metadata?: Record<string, unknown>;
};

export type PublishManifest = {
  runId: string;
  thesis: string;
  generatedAt: string;
  publicAssetBaseUrl: string;
  assetRootUrl: string;
  timezone: string;
  posts: PublishPost[];
};
