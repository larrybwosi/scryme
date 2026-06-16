import { Injectable, NestMiddleware } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();
    req.headers["x-correlation-id"] = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    next();
  }
}
