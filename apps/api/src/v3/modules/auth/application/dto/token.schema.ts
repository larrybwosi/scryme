import { z } from "zod";

export const TokenRequestSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().optional(),
});
