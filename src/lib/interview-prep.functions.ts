import { createServerFn } from "@tanstack/react-start";
import type { InterviewPrep } from "./interview-prep.server";

export const generateInterviewPrep = createServerFn({ method: "POST" })
  .inputValidator((data: { emailText: string }) => data)
  .handler(async ({ data }) => {
    const { generatePrep } = await import("./interview-prep.server");
    return generatePrep(data.emailText);
  });
