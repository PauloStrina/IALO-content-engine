import "dotenv/config";
import fs from "node:fs/promises";
import OpenAI from "openai";
import { z } from "zod";
import { readJson } from "../lib/read-json.js";
import type { Thesis, ThesisKey } from "../types/content.js";

const slideSchema = z.object({
  number: z.number(),
  type: z.enum(["cover", "body", "question", "closing"]),
  text: z.string().min(1)
});

const carouselSchema = z.object({
  title: z.string().min(1),
  caption: z.string().min(1),
  slides: z.array(slideSchema).min(8).max(12),
  cta: z.string().min(1)
});

type Theses = Record<ThesisKey, Thesis>;

const thesisKey = (process.env.THESIS || "cambio-adentro") as ThesisKey;
const outputPath = process.env.OUTPUT_PATH || "output/carousel-copy.json";

const theses = await readJson<Theses>("brand/theses.json");
const voice = await fs.readFile("brand/voice.json", "utf-8");
const basePrompt = await fs.readFile("src/prompts/carousel.prompt.md", "utf-8");
const thesis = theses[thesisKey];

if (!thesis) {
  throw new Error(`Unknown thesis: ${thesisKey}`);
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `${basePrompt}

## Voz IALO
${voice}

## Tesis semanal
${JSON.stringify(thesis, null, 2)}

## Pedido
Creá un carrusel de 10 slides para Instagram.
La primera slide debe ser cover.
La última slide debe ser closing.
Al menos una slide debe ser question.
`;

const response = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.8,
  response_format: { type: "json_object" }
});

const content = response.choices[0]?.message?.content;

if (!content) {
  throw new Error("OpenAI returned no content");
}

const parsed = carouselSchema.parse(JSON.parse(content));

await fs.mkdir("output", { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(parsed, null, 2)}\n`);

console.log(`Carousel copy generated at ${outputPath}`);
