import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

@Injectable()
export class V3ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // Only validate request body payloads (and occasionally query/param if we want, but usually body)
    if (metadata.type !== "body") {
      return value;
    }

    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Validation failed",
          error: "BAD_REQUEST",
          details: error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }
      throw new BadRequestException({
        message: "Validation failed",
        error: "BAD_REQUEST",
      });
    }
  }
}
