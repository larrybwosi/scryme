import { describe, it, expect } from "vitest";
import { getResolvedApiUrl, getResolvedSocketUrl } from "../urls";

describe("URL Resolution Logic for Projects App", () => {
  describe("getResolvedApiUrl", () => {
    it("defaults to localhost:3002 in development mode when unset", () => {
      const url = getResolvedApiUrl(undefined, "development");
      expect(url).toBe("http://localhost:3002");
    });

    it("defaults to https://api.scryme.tech in production mode when unset", () => {
      const url = getResolvedApiUrl(undefined, "production");
      expect(url).toBe("https://api.scryme.tech");
    });

    it("overrides localhost with https://api.scryme.tech in production mode", () => {
      const urlWithPort = getResolvedApiUrl("http://localhost:3002", "production");
      expect(urlWithPort).toBe("https://api.scryme.tech");

      const urlWithIp = getResolvedApiUrl("http://127.0.0.1:3002", "production");
      expect(urlWithIp).toBe("https://api.scryme.tech");

      const urlWithZero = getResolvedApiUrl("http://0.0.0.0:3002", "production");
      expect(urlWithZero).toBe("https://api.scryme.tech");
    });

    it("ignores PLACEHOLDER values and falls back to production default in production", () => {
      const url = getResolvedApiUrl("APP_NEXT_PUBLIC_API_URL_PLACEHOLDER", "production");
      expect(url).toBe("https://api.scryme.tech");
    });

    it("preserves valid external API URLs in production", () => {
      const url = getResolvedApiUrl("https://api.staging.scryme.tech", "production");
      expect(url).toBe("https://api.staging.scryme.tech");
    });

    it("strips ports for scryme.tech hostnames", () => {
      const url = getResolvedApiUrl("https://api.scryme.tech:4000", "production");
      expect(url).toBe("https://api.scryme.tech");
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
});
