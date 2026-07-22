// src/config/api.ts

export const API_ROUTES = {
  FULFILLMENT: {
    WAYBILL: (id: string) => `api/v2/pos/waybill/${id}`,
    PACKING_LIST: (id: string) => `api/v2/pos/packing-list/${id}`,
    // Example of future route
    // FULFILLMENT_WAYBILL: (fulfillmentId: string) => `api/v2/fulfillment/${fulfillmentId}/waybill`,
  },
  // Add other frontend routes here as they are discovered.
};
