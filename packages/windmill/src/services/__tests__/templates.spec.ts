import { describe, it, expect } from "vitest";
import { WindmillTemplateService } from "../templates";

describe("WindmillTemplateService", () => {
  describe("getTemplates", () => {
    it("should scan templates directory and extract metadata and parameters", async () => {
      const templates = await WindmillTemplateService.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      const firstTemplate = templates[0];
      expect(firstTemplate).toHaveProperty("path");
      expect(firstTemplate).toHaveProperty("name");
      expect(firstTemplate).toHaveProperty("category");
      expect(firstTemplate).toHaveProperty("parameters");
      expect(Array.isArray(firstTemplate.parameters)).toBe(true);
    });
  });
});
