import { describe, it, expect, beforeEach } from "vitest";
import { AiReportService } from "../application/services/ai-report.service";

describe("AiReportService", () => {
  let aiService: AiReportService;

  beforeEach(() => {
    aiService = new AiReportService();
  });

  it("should generate rule-based insights when OpenAI key is missing", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const mockData = {
      sales: {
        totalRevenue: 1500,
        transactionCount: 10,
        topProducts: [{ name: "Croissant", quantity: 25, revenue: 100 }],
      },
      inventory: {
        totalIn: 50,
        totalOut: 120,
        topMovedItems: [{ name: "Flour 25kg", qty: 50 }],
      },
      production: {
        totalBatches: 5,
        totalWaste: 2,
        topRecipes: [{ name: "Sourdough", quantity: 50, unit: "loaves" }],
      },
      tax: {
        outputTax: 240,
        inputTax: 100,
        netVatPayable: 140,
      },
    };

    const insights = await aiService.generateExecutiveInsights(mockData, "Test Business");

    expect(insights).toContain("Sales Performance");
    expect(insights).toContain("$1500.00");
    expect(insights).toContain("Top Seller");
    expect(insights).toContain("Croissant");
    expect(insights).toContain("Stock Turnover");
    expect(insights).toContain("Production Efficiency");
    expect(insights).toContain("Tax Obligation");

    if (originalApiKey) process.env.OPENAI_API_KEY = originalApiKey;
  });
});
