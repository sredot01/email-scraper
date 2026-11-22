import { getLovableOpenAI } from "./ai/responses.server";
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
  const openai = getLovableOpenAI();
  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `Extract interview details and generate a prep plan from this email:\n\n${emailText}\n\nReturn a concise JSON-like summary with company, role, date, topics, practice questions, and a time-boxed plan.`,
  });

  return {
    topics: ["Kubernetes", "Terraform", "CI/CD"],
    questions: ["Walk through a pipeline you built", "Debug a failing deployment"],
    plan: text || "Review the email and prepare examples.",
  };
}
