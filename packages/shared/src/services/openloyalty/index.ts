export function getOpenLoyaltyConfig() {
  const url = process.env.OPEN_LOYALTY_URL;
  const apiKey = process.env.OPEN_LOYALTY_API_KEY;
  const storeCode = process.env.OPEN_LOYALTY_STORE_CODE || 'default';

  if (!url) throw new Error('OPEN_LOYALTY_URL environment variable is not set');
  if (!apiKey) throw new Error('OPEN_LOYALTY_API_KEY environment variable is not set');

  return { url, apiKey, storeCode };
}

export const OpenLoyaltyClient = {
  /**
   * Registers a customer in Open Loyalty so they can start earning points.
   */
  async registerCustomer(customerId: string, email: string, phone?: string) {
    const { url, apiKey, storeCode } = getOpenLoyaltyConfig();
    const res = await fetch(`${url}/api/${storeCode}/customer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        email,
        phone,
      }),
    });
    if (!res.ok) throw new Error(`Failed to register customer in Open Loyalty: ${await res.text()}`);
    return res.json();
  },

  /**
   * Submits a transaction (e.g., Paid Invoice) to Open Loyalty.
   */
  async submitTransaction(
    customerId: string,
    transactionId: string,
    grossValue: number,
    items: { sku: string; name: string; quantity: number; price: number }[]
  ) {
    const { url, apiKey, storeCode } = getOpenLoyaltyConfig();
    const res = await fetch(`${url}/api/${storeCode}/transaction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionData: {
          documentNumber: transactionId,
          grossValue,
          customerData: { customerId },
          items: items.map(item => ({
            sku: { code: item.sku },
            name: item.name,
            quantity: item.quantity,
            grossValue: item.price * item.quantity,
          })),
        },
      }),
    });
    if (!res.ok) throw new Error(`Failed to submit transaction: ${await res.text()}`);
    return res.json();
  },

  async addPoints(customerId: string, points: number, reason: string) {
    const { url, apiKey, storeCode } = getOpenLoyaltyConfig();
    const res = await fetch(`${url}/api/${storeCode}/customer/${customerId}/points/add`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason }),
    });
    if (!res.ok) throw new Error(`Failed to add points: ${await res.text()}`);
    return res.json();
  },

  async deductPoints(customerId: string, points: number, reason: string) {
    const { url, apiKey, storeCode } = getOpenLoyaltyConfig();
    const res = await fetch(`${url}/api/${storeCode}/customer/${customerId}/points/spend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, reason }),
    });
    if (!res.ok) throw new Error(`Failed to deduct points: ${await res.text()}`);
    return res.json();
  },

  /**
   * Retrieves a customer's transaction and point history directly from Open Loyalty.
   */
  async getCustomerTransactions(customerId: string) {
    const { url, apiKey, storeCode } = getOpenLoyaltyConfig();
    const res = await fetch(`${url}/api/${storeCode}/customer/${customerId}/transaction`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch transactions: ${await res.text()}`);
    }

    return res.json();
  },
};
