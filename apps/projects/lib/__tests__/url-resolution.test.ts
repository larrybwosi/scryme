import { describe, it, expect } from "vitest";
import { getResolvedApiUrl, getResolvedSocketUrl, getResolvedAuthUrl } from "../urls";

describe("URL Resolution Logic for Projects App", () => {
  describe("getResolvedApiUrl", () => {
    it("defaults to localhost:3002 in development mode when unset", () => {
      const url = getResolvedApiUrl(undefined, "development");
      expect(url).toBe("http://localhost:3002/api");
    });

    it("defaults to https://api.scryme.tech in production mode when unset", () => {
      const url = getResolvedApiUrl(undefined, "production");
      expect(url).toBe("https://api.scryme.tech/api");
    });

    it("overrides localhost with https://api.scryme.tech in production mode", () => {
      const urlWithPort = getResolvedApiUrl("http://localhost:3002", "production");
      expect(urlWithPort).toBe("https://api.scryme.tech/api");

      const urlWithIp = getResolvedApiUrl("http://127.0.0.1:3002", "production");
      expect(urlWithIp).toBe("https://api.scryme.tech/api");

      const urlWithZero = getResolvedApiUrl("http://0.0.0.0:3002", "production");
      expect(urlWithZero).toBe("https://api.scryme.tech/api");
    });

    it("ignores PLACEHOLDER values and falls back to production default in production", () => {
      const url = getResolvedApiUrl("APP_NEXT_PUBLIC_API_URL_PLACEHOLDER", "production");
      expect(url).toBe("https://api.scryme.tech/api");
    });

    it("preserves valid external API URLs in production", () => {
      const url = getResolvedApiUrl("https://api.staging.scryme.tech", "production");
      expect(url).toBe("https://api.staging.scryme.tech/api");
    });

    it("strips ports for scryme.tech hostnames", () => {
      const url = getResolvedApiUrl("https://api.scryme.tech:4000", "production");
      expect(url).toBe("https://api.scryme.tech/api");
    });
  });

  describe("getResolvedSocketUrl", () => {
    it("defaults to localhost:3002 in development mode when unset", () => {
      const url = getResolvedSocketUrl(undefined, "development");
      expect(url).toBe("http://localhost:3002");
    });

    it("defaults to https://api.scryme.tech in production mode when unset", () => {
      const url = getResolvedSocketUrl(undefined, "production");
      expect(url).toBe("https://api.scryme.tech");
    });

    it("overrides localhost with https://api.scryme.tech in production mode", () => {
      const url = getResolvedSocketUrl("http://localhost:3002", "production");
      expect(url).toBe("https://api.scryme.tech");

      const wsLocal = getResolvedSocketUrl("ws://localhost:3002", "production");
      expect(wsLocal).toBe("https://api.scryme.tech");
    });

    it("ignores PLACEHOLDER values and falls back to production default in production", () => {
      const url = getResolvedSocketUrl("APP_NEXT_PUBLIC_SOCKET_URL_PLACEHOLDER", "production");
      expect(url).toBe("https://api.scryme.tech");
    });

    it("preserves valid custom WebSocket/Socket URLs in production", () => {
      const url = getResolvedSocketUrl("wss://api.staging.scryme.tech", "production");
      expect(url).toBe("wss://api.staging.scryme.tech");
    });
  });

  describe("getResolvedAuthUrl", () => {
    it("defaults to localhost:4444 in development mode when unset", () => {
      const url = getResolvedAuthUrl(undefined, "development");
      expect(url).toBe("http://localhost:4444");
    });

    it("defaults to https://auth.scryme.tech in production mode when unset", () => {
      const url = getResolvedAuthUrl(undefined, "production");
      expect(url).toBe("https://auth.scryme.tech");
    });

    it("overrides localhost with https://auth.scryme.tech in production mode", () => {
      const urlWithPort = getResolvedAuthUrl("http://localhost:4444", "production");
      expect(urlWithPort).toBe("https://auth.scryme.tech");

      const urlWithIp = getResolvedAuthUrl("http://127.0.0.1:4444", "production");
      expect(urlWithIp).toBe("https://auth.scryme.tech");

      const urlWithZero = getResolvedAuthUrl("http://0.0.0.0:4444", "production");
      expect(urlWithZero).toBe("https://auth.scryme.tech");
    });

    it("ignores PLACEHOLDER values and falls back to production default in production", () => {
      const url = getResolvedAuthUrl("APP_NEXT_PUBLIC_AUTH_URL_PLACEHOLDER", "production");
      expect(url).toBe("https://auth.scryme.tech");
    });

    it("preserves valid external auth URLs in production", () => {
      const url = getResolvedAuthUrl("https://auth.staging.scryme.tech", "production");
      expect(url).toBe("https://auth.staging.scryme.tech");
    });

    it("strips ports for scryme.tech hostnames", () => {
      const url = getResolvedAuthUrl("https://auth.scryme.tech:4444", "production");
      expect(url).toBe("https://auth.scryme.tech");
    });
  });
});
