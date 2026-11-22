import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GeneratePrepSchema = z.object({
  role: z.string().min(1),
  company: z.string().optional(),
  experience: z.string().optional(),
});

export const generateInterviewPrep = createServerFn({ method: "POST" })
  .validator(GeneratePrepSchema)
  .handler(async ({ data }) => {
    const { generatePrep } = await import("./interview-prep.server");
    return generatePrep(data);
  });
