import { z } from "zod";

export const CreateOAuthClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  redirectUris: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one redirect URI is required"),
  icon: z.string().url("Must be a valid URL").optional(),
  uri: z.string().url("Must be a valid URL").optional(),
  tos: z.string().url("Must be a valid URL").optional(),
  policy: z.string().url("Must be a valid URL").optional(),
  public: z.boolean().optional().default(false),
  skipConsent: z.boolean().optional().default(false),
});

export const UpdateOAuthClientSchema = CreateOAuthClientSchema.partial();

export type CreateOAuthClientDtoInput = z.infer<typeof CreateOAuthClientSchema>;
export type UpdateOAuthClientDtoInput = z.infer<typeof UpdateOAuthClientSchema>;
