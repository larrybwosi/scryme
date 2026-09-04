import { computeCustomerHealthScore, parseCustomerCsv } from "../customer-enterprise";

describe("Customer Enterprise Pure Helper Logic", () => {
  describe("computeCustomerHealthScore", () => {
    it("should compute high score and LOW risk for frequent active high-spending customer", () => {
      const result = computeCustomerHealthScore({
        orderCount: 15,
        totalSpent: 12000,
        daysSinceLastOrder: 10,
        activityCount: 8,
      });

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.riskLevel).toBe("LOW");
      expect(result.metrics.recencyScore).toBe(30);
      expect(result.metrics.frequencyScore).toBe(25);
      expect(result.metrics.monetaryScore).toBe(30);
      expect(result.metrics.activityScore).toBe(10);
    });

    it("should compute CRITICAL risk for inactive churned customer", () => {
      const result = computeCustomerHealthScore({
        orderCount: 1,
        totalSpent: 100,
        daysSinceLastOrder: 150,
        activityCount: 0,
      });

      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.score).toBeLessThan(25);
    });
  });

  describe("parseCustomerCsv", () => {
    it("should correctly parse CSV string into customer records", () => {
      const csv = `Name,Email,Phone,Company\nJohn Doe,john@example.com,+254700000000,Acme Corp\nJane Smith,jane@example.com,+254711111111,Tech Inc`;
      const records = parseCustomerCsv(csv);

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "+254700000000",
        company: "Acme Corp",
      });
      expect(records[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+254711111111",
        company: "Tech Inc",
      });
    });
  });
});
