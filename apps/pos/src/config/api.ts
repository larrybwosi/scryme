// src/config/api.ts

export const API_ROUTES = {
  FULFILLMENT: {
    WAYBILL: (id: string) => `api/v3/:orgSlug/pos/waybill/${id}`,
    PACKING_LIST: (id: string) => `api/v3/:orgSlug/pos/packing-list/${id}`,
    // Example of future route
    // FULFILLMENT_WAYBILL: (fulfillmentId: string) => `api/v3/:orgSlug/fulfillment/${fulfillmentId}/waybill`,
  },
  // Add other frontend routes here as they are discovered.
};
