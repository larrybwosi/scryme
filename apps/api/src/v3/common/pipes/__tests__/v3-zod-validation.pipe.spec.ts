import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { V3ZodValidationPipe } from "../v3-zod-validation.pipe";

describe("V3ZodValidationPipe", () => {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().min(18, "Must be at least 18"),
    email: z.string().email("Invalid email"),
  });

  let pipe: V3ZodValidationPipe;

  beforeEach(() => {
    pipe = new V3ZodValidationPipe(schema);
  });

  it("should return the value if validation passes", () => {
    const validData = {
      name: "Alice",
      age: 25,
      email: "alice@example.com",
    };

    const result = pipe.transform(validData, { type: "body" } as any);
    expect(result).toEqual(validData);
  });

  it("should bypass validation if metadata type is not body", () => {
    const invalidData = {
      name: "",
      age: 10,
      email: "invalid-email",
    };

    const result = pipe.transform(invalidData, { type: "query" } as any);
    expect(result).toEqual(invalidData);
  });

  it("should throw BadRequestException with formatted errors if validation fails", () => {
    const invalidData = {
      name: "",
      age: 16,
      email: "invalid-email",
    };

    expect(() => {
      pipe.transform(invalidData, { type: "body" } as any);
    }).toThrow(BadRequestException);

    try {
      pipe.transform(invalidData, { type: "body" } as any);
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = err.getResponse();
      expect(response.message).toBe("Validation failed");
      expect(response.error).toBe("BAD_REQUEST");
      expect(response.details).toBeDefined();
      expect(response.details.length).toBe(3);

      // Verify detailed format
      expect(response.details[0]).toEqual({
        path: "name",
        message: "Name is required",
        code: "too_small",
      });
      expect(response.details[1]).toEqual({
        path: "age",
        message: "Must be at least 18",
        code: "too_small",
      });
      expect(response.details[2]).toEqual({
        path: "email",
        message: "Invalid email",
        code: "invalid_format",
      });
    }
  });
});
