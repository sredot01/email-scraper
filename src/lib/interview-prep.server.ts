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

export async function generatePrep(emailText: string): Promise<InterviewPrep> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: `You are an expert interview coach. Analyze this interview email and return a structured prep plan.\n\nEmail:\n${emailText}\n\nRespond in this exact format:\nCOMPANY: ...\nROLE: ...\nDATE: ...\nTOPICS: topic1, topic2, topic3\nQUESTIONS:\n- question 1\n- question 2\nPLAN: a concise time-boxed preparation plan`,
  });

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
