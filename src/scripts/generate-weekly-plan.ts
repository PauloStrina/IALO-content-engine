import "dotenv/config";
import fs from "node:fs/promises";
import OpenAI from "openai";
import { readJson } from "../lib/read-json.js";
import type { Thesis, ThesisKey } from "../types/content.js";

type Theses = Record<ThesisKey, Thesis>;

const thesisKey = (process.env.THESIS || "cambio-adentro") as ThesisKey;
const outputPath = process.env.OUTPUT_PATH || "output/weekly-plan.json";

const theses = await readJson<Theses>("brand/theses.json");
const contentRules = await fs.readFile("brand/content-rules.json", "utf-8");
const editorialExamples = await fs.readFile("brand/editorial-examples.json", "utf-8");
const basePrompt = await fs.readFile("src/prompts/weekly-plan.prompt.md", "utf-8");
const thesis = theses[thesisKey];

if (!thesis) {
  throw new Error(`Unknown thesis: ${thesisKey}`);
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `${basePrompt}

## Reglas editoriales
${contentRules}

## Ejemplos editoriales
${editorialExamples}

## Tesis semanal
${JSON.stringify(thesis, null, 2)}

Generá 7 piezas para una semana completa, manteniendo una sola tesis como foco.
Antes de responder, verificá internamente que los hooks usen un nosotros implicado y no diagnostiquen al lector desde afuera.
`;

const response = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.65,
  response_format: { type: "json_object" }
});

const content = response.choices[0]?.message?.content;

if (!content) {
  throw new Error("OpenAI returned no content");
}

await fs.mkdir("output", { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(JSON.parse(content), null, 2)}\n`);

console.log(`Weekly plan generated at ${outputPath}`);
