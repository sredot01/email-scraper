import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function generatePrep(data: { role: string; company?: string; experience?: string }) {
  const prompt = `Generate interview preparation for role: ${data.role}${data.company ? ` at ${data.company}` : ""}. Experience: ${data.experience || "not specified"}`;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
  });

  return { prep: text };
}
