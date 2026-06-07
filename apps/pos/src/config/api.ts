// src/config/api.ts

export const API_ROUTES = {
  FULFILLMENT: {
    WAYBILL: (id: string) => `pos/waybill/${id}`,
  },
};
