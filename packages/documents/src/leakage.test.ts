import { describe, it, expect } from "vitest";
import * as Client from "./client";

describe("Client Entry Point Leakage", () => {
  it("should not export server-only rendering functions", () => {
    const forbidden = [
      "renderToBuffer",
      "renderToStream",
      "renderToFile",
      "renderToString",
      "DocumentGenerator",
    ];

    forbidden.forEach((fn) => {
      expect((Client as any)[fn]).toBeUndefined();
    });
  });

  it("should export client-side components", () => {
    const expected = [
      "PDFDownloadLink",
      "PDFViewer",
      "BlobProvider",
      "Document",
      "Page",
      "Text",
      "View",
    ];

    expected.forEach((component) => {
      expect((Client as any)[component]).toBeDefined();
    });
  });
});
