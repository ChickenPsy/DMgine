import { z } from "zod";

export const generateDmRequestSchema = z.object({
  target: z.string().min(1, "Target is required"),
  tone: z.enum(["professional", "casual", "chaos"], {
    required_error: "Tone is required",
  }),
});

export type GenerateDmRequest = z.infer<typeof generateDmRequestSchema>;