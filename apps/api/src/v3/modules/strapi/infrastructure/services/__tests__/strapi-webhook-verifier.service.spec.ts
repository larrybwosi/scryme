import { Test, TestingModule } from "@nestjs/testing";
import { StrapiWebhookVerifierService } from "../strapi-webhook-verifier.service";
import { UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import { describe, it, expect, beforeEach } from "vitest";

describe("StrapiWebhookVerifierService", () => {
  let service: StrapiWebhookVerifierService;

  const mockSecret = "my-secure-strapi-webhook-secret-key";
  const mockPayload = {
    event: "entry.update",
    model: "product",
    data: { id: 123, name: "Sourdough Bread" },
  };
  const rawBody = Buffer.from(JSON.stringify(mockPayload), "utf-8");

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StrapiWebhookVerifierService],
    }).compile();

    service = module.get<StrapiWebhookVerifierService>(StrapiWebhookVerifierService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("verify", () => {
    it("should verify a valid signature successfully", () => {
      const signature = crypto
        .createHmac("sha256", mockSecret)
        .update(rawBody)
        .digest("hex");

      expect(() => service.verify(rawBody, signature, mockSecret)).not.toThrow();
    });

    it("should throw UnauthorizedException if the signature header is missing or empty", () => {
      expect(() => service.verify(rawBody, undefined, mockSecret)).toThrow(
        UnauthorizedException,
      );

      expect(() => service.verify(rawBody, "", mockSecret)).toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for an invalid signature of the correct length", () => {
      const wrongSignature = crypto
        .createHmac("sha256", "wrong-secret")
        .update(rawBody)
        .digest("hex");

      expect(() => service.verify(rawBody, wrongSignature, mockSecret)).toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for an invalid signature of a different/incorrect length", () => {
      const shortSignature = "abc123def456";

      expect(() => service.verify(rawBody, shortSignature, mockSecret)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("isValid", () => {
    it("should correctly validate using isValid helper", () => {
      const validSignature = crypto
        .createHmac("sha256", mockSecret)
        .update(rawBody)
        .digest("hex");

      expect(service.isValid(rawBody, validSignature, mockSecret)).toBe(true);
      expect(service.isValid(rawBody, "invalid", mockSecret)).toBe(false);
      expect(service.isValid(rawBody, undefined, mockSecret)).toBe(false);
    });
  });

  describe("sign", () => {
    it("should generate correct signatures using the sign helper", () => {
      const expected = crypto
        .createHmac("sha256", mockSecret)
        .update(JSON.stringify(mockPayload))
        .digest("hex");

      const signed = service.sign(mockPayload, mockSecret);
      expect(signed).toBe(expected);
    });
  });
});