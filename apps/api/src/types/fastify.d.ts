import {V2ApiContext} from "@repo/shared/server";
import {OpenObserveService} from "../common/services/openobserve.service";

declare module "fastify" {
  interface FastifyRequest {
    v2Context?: V2ApiContext;
    openObserveService?: OpenObserveService;
  }
}
