import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export type InterviewPrep = {
  company: string;
  role: string;
  interviewWhen: string;
  summary: string;
  notes: string[];
  topics: { name: string; focus: string }[];
  questions: { category: string; question: string; whatTheyLookFor: string }[];
  prepPlan: { when: string; task: string; detail: string }[];
};

// Prioritize most stable free-tier models
const FREE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.8-flash",
];

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  while (requestTimestamps.length && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error("Please wait ~1 minute (free tier rate limit). Your free tokens are protected.");
  }
  requestTimestamps.push(now);
}

async function callModel(modelName: string, apiKey: string, emailText: string): Promise<string> {
  const google = createGoogleGenerativeAI({ apiKey });
  const { text } = await generateText({
    model: google(modelName),
    prompt: `You are an expert technical interview coach. Analyze this interview email and return ONLY valid JSON (no markdown) matching this exact shape:\n{\n  "company": "string",\n  "role": "string",\n  "interviewWhen": "string",\n  "summary": "string",\n  "notes": ["string"],\n  "topics": [{"name": "string", "focus": "string"}],\n  "questions": [{"category": "string", "question": "string", "whatTheyLookFor": "string"}],\n  "prepPlan": [{"when": "string", "task": "string", "detail": "string"}]\n}\n\nEmail:\n${emailText}\n\nReturn only the JSON object.`,
  });
  return text;
}

export async function generatePrep(emailText: string): Promise<InterviewPrep> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");

  checkRateLimit();

  let lastError: unknown;
  for (const model of FREE_MODELS) {
    try {
      const raw = await callModel(model, apiKey, emailText);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const json = JSON.parse(cleaned);
      return {
        company: String(json.company || ""),
        role: String(json.role || ""),
        interviewWhen: String(json.interviewWhen || ""),
        summary: String(json.summary || ""),
        notes: Array.isArray(json.notes) ? json.notes.map(String) : [],
        topics: Array.isArray(json.topics) ? json.topics : [],
        questions: Array.isArray(json.questions) ? json.questions : [],
        prepPlan: Array.isArray(json.prepPlan) ? json.prepPlan : [],
      };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Continue to next free model on any recoverable error
      if (/high demand|unavailable|not found|404|429|quota|json|parse/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `Free models are temporarily busy. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}. Try again in a minute — your free tokens are still available.`
  );
}
