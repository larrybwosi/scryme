export interface ReportSummaryData {
  sales?: {
    totalRevenue: number;
    transactionCount: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
  };
  inventory?: {
    totalIn: number;
    totalOut: number;
    topMovedItems: { name: string; qty: number }[];
  };
  production?: {
    totalBatches: number;
    totalWaste: number;
    topRecipes: { name: string; quantity: number; unit: string }[];
  };
  tax?: {
    outputTax: number;
    inputTax: number;
    netVatPayable: number;
  };
}

export class AiReportService {
  private readonly logger = {
    warn: (msg: string) => console.warn(`[AiReportService] ${msg}`),
    log: (msg: string) => console.log(`[AiReportService] ${msg}`),
  };

  async generateExecutiveInsights(data: ReportSummaryData, orgName: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        return await this.generateWithOpenAI(data, orgName, apiKey);
      } catch (error: any) {
        this.logger.warn(`OpenAI AI generation failed, falling back to rule-based insights: ${error.message}`);
      }
    }

    return this.generateRuleBasedInsights(data, orgName);
  }

  private async generateWithOpenAI(data: ReportSummaryData, orgName: string, apiKey: string): Promise<string> {
    const prompt = `You are Scryme Executive AI, an advanced business analytics assistant for "${orgName}". Analyze the following performance data for the recent period and generate concise, professional Executive Insights & Recommendations (max 4 bullet points, use markdown with emojis):

Data Payload:
${JSON.stringify(data, null, 2)}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert executive financial and operational analyst." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned HTTP ${response.status}`);
    }

    const resJson = await response.json();
    const result = resJson.choices?.[0]?.message?.content?.trim();
    if (!result) throw new Error("Empty response from OpenAI");

    return result;
  }

  private generateRuleBasedInsights(data: ReportSummaryData, orgName: string): string {
    const insights: string[] = [];

    if (data.sales) {
      if (data.sales.totalRevenue > 0) {
        const avgTicket = data.sales.transactionCount > 0
          ? (data.sales.totalRevenue / data.sales.transactionCount).toFixed(2)
          : "0.00";
        insights.push(`📈 **Sales Performance:** Total revenue reached **$${data.sales.totalRevenue.toFixed(2)}** across **${data.sales.transactionCount}** transactions (Avg order: **$${avgTicket}**).`);
      } else {
        insights.push(`⚠️ **Sales Notice:** No completed sales transactions recorded during this period.`);
      }

      if (data.sales.topProducts && data.sales.topProducts.length > 0) {
        const top = data.sales.topProducts[0];
        insights.push(`🔥 **Top Seller:** **${top.name}** led sales volume with **${top.quantity}** units sold generating **$${top.revenue.toFixed(2)}**.`);
      }
    }

    if (data.inventory) {
      if (data.inventory.totalOut > data.inventory.totalIn && data.inventory.totalIn > 0) {
        insights.push(`📦 **Stock Turnover:** Outgoing stock (**${data.inventory.totalOut.toFixed(2)}**) exceeded replenishment (**${data.inventory.totalIn.toFixed(2)}**). Consider reordering high-velocity items.`);
      } else if (data.inventory.totalIn > 0 || data.inventory.totalOut > 0) {
        insights.push(`📦 **Inventory Flow:** Total stock in: **${data.inventory.totalIn.toFixed(2)}** items | Total stock out: **${data.inventory.totalOut.toFixed(2)}** items.`);
      }
    }

    if (data.production) {
      if (data.production.totalBatches > 0) {
        const wasteRatio = data.production.totalWaste > 0 ? ` (Waste: ${data.production.totalWaste.toFixed(2)} units)` : " (Zero recorded waste)";
        insights.push(`👨‍🍳 **Production Efficiency:** Completed **${data.production.totalBatches}** production batches${wasteRatio}.`);
      }
    }

    if (data.tax) {
      if (data.tax.netVatPayable > 0) {
        insights.push(`🏛️ **Tax Obligation:** Estimated Net Tax Payable is **$${data.tax.netVatPayable.toFixed(2)}** (Output Tax: $${data.tax.outputTax.toFixed(2)} - Input Tax: $${data.tax.inputTax.toFixed(2)}).`);
      }
    }

    if (insights.length === 0) {
      insights.push(`ℹ️ **Operational Summary:** All systems stable for ${orgName}. Regular operational monitoring active.`);
    }

    return insights.map(i => `* ${i}`).join("\n");
  }
}
