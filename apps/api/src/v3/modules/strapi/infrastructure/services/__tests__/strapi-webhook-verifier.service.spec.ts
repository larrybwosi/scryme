import { Test, TestingModule } from "@nestjs/testing";
import { StrapiWebhookVerifierService } from "../strapi-webhook-verifier.service";
import { UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import { describe, it, expect, beforeEach } from "vitest";

describe("StrapiWebhookVerifierService", () => {
  let service: StrapiWebhookVerifierService;

  const mockSecret = "my-strapi-webhook-secret";
  const mockPayload = { event: "entry.create", model: "product" };
  const mockRawBody = Buffer.from(JSON.stringify(mockPayload));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StrapiWebhookVerifierService],
    }).compile();

    service = module.get<StrapiWebhookVerifierService>(StrapiWebhookVerifierService);
  });

  describe("verify", () => {
    it("should verify a valid signature successfully", () => {
      const expectedSignature = crypto
        .createHmac("sha256", mockSecret)
        .update(mockRawBody)
        .digest("hex");

      expect(() => {
        service.verify(mockRawBody, expectedSignature, mockSecret);
      }).not.toThrow();
    });

    it("should throw UnauthorizedException if signature is missing", () => {
      expect(() => {
        service.verify(mockRawBody, undefined, mockSecret);
      }).toThrow(UnauthorizedException);

      expect(() => {
        service.verify(mockRawBody, "", mockSecret);
      }).toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for an invalid signature of correct length", () => {
      const invalidSignature = crypto.randomBytes(32).toString("hex");

      expect(() => {
        service.verify(mockRawBody, invalidSignature, mockSecret);
      }).toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for an invalid signature of different/incorrect length", () => {
      const shortSignature = "too_short";

      expect(() => {
        service.verify(mockRawBody, shortSignature, mockSecret);
      }).toThrow(UnauthorizedException);
    });
  });

  describe("isValid", () => {
    it("should return true for a valid signature", () => {
      const expectedSignature = crypto
        .createHmac("sha256", mockSecret)
        .update(mockRawBody)
        .digest("hex");

      expect(service.isValid(mockRawBody, expectedSignature, mockSecret)).toBe(true);
    });

    it("should return false for an invalid or missing signature", () => {
      expect(service.isValid(mockRawBody, "invalid", mockSecret)).toBe(false);
      expect(service.isValid(mockRawBody, undefined, mockSecret)).toBe(false);
    });
  });

  describe("sign", () => {
    it("should generate the expected hmac signature", () => {
      const signature = service.sign(mockPayload, mockSecret);
      const expectedSignature = crypto
        .createHmac("sha256", mockSecret)
        .update(JSON.stringify(mockPayload))
        .digest("hex");

      expect(signature).toBe(expectedSignature);
    });
  });
});
