import { V2ApiContext } from "@repo/shared/api/v2";

declare module "fastify" {
  interface FastifyRequest {
    v2Context?: V2ApiContext;
  }
}
