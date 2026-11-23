import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export type InterviewPrep = {
  company?: string;
  role?: string;
  date?: string;
  topics: string[];
  questions: string[];
  plan: string;
};

// Free-tier models (order of preference). Flash-Lite has higher free limits.
const FREE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
];

// Simple in-memory rate limiter (per serverless instance)
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 4; // stay under free tier ~5 RPM
const requestTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  while (requestTimestamps.length && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error("Rate limit: please wait a minute before generating another prep (free tier protection).");
  }
  requestTimestamps.push(now);
}

async function callModel(modelName: string, apiKey: string, emailText: string): Promise<string> {
  const google = createGoogleGenerativeAI({ apiKey });
  const { text } = await generateText({
    model: google(modelName),
    prompt: `You are an expert interview coach. Analyze this interview email and return a structured prep plan.\n\nEmail:\n${emailText}\n\nRespond in this exact format:\nCOMPANY: ...\nROLE: ...\nDATE: ...\nTOPICS: topic1, topic2, topic3\nQUESTIONS:\n- question 1\n- question 2\nPLAN: a concise time-boxed preparation plan`,
  });
  return text;
}

export async function generatePrep(emailText: string): Promise<InterviewPrep> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  checkRateLimit();

  let lastError: unknown;
  for (const model of FREE_MODELS) {
    try {
      const text = await callModel(model, apiKey, emailText);
      return parseResponse(text);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Skip to next model on high-demand or unavailable
      if (/high demand|unavailable|not found|404|429/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `All free models failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}. Try again in a minute.`
  );
}

function parseResponse(text: string): InterviewPrep {
  const lines = text.split("\n");
  const get = (prefix: string) =>
    lines.find((l) => l.toUpperCase().startsWith(prefix))?.split(":").slice(1).join(":").trim() || "";

  const topics = get("TOPICS").split(",").map((s) => s.trim()).filter(Boolean);
  const questions = lines
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return {
    company: get("COMPANY"),
    role: get("ROLE"),
    date: get("DATE"),
    topics: topics.length ? topics : ["Review the email topics"],
    questions: questions.length ? questions : ["Prepare examples for the mentioned skills"],
    plan: get("PLAN") || text,
  };
}
