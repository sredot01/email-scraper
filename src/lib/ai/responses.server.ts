import { createOpenAI } from "@ai-sdk/openai";
import { createLovableAiGatewayRunIdFetch } from "./run-id";

export const LOVABLE_AI_GATEWAY_URL = "https://ai-gateway.lovable.dev/v1";

export function getLovableOpenAI() {
  return createOpenAI({
    baseURL: LOVABLE_AI_GATEWAY_URL,
    fetch: createLovableAiGatewayRunIdFetch(),
  });
}
