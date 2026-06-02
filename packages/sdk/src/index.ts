export const getSDK = (config: any) => ({
  client: {
    getBaseURL: () => config.baseURL,
    setBaseURL: (url: string) => { config.baseURL = url; }
  },
  setApiKey: (key: string) => {},
  bakery: new Proxy({}, {
    get: (target, prop) => {
      return () => Promise.resolve({ data: [] });
    }
  })
});

export type BakeryBatchListResponse = any;
export type Product = any;
export type ProductType = any;
export type ProductVariant = any;
export type MemberRole = any;
export type BakeryBranding = any;
