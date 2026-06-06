export const getSDK = (config: any) => {
  const defaultResponse = () => Promise.resolve({ data: [] });
  const proxyHandler = {
    get: (target: any, prop: string) => {
      if (prop === "getAuthStatus")
        return () => Promise.resolve({ user: { id: "1", role: "ADMIN" } });
      if (prop === "getSettings")
        return () => Promise.resolve({ settings: {} });
      if (prop === "logout") return () => Promise.resolve();
      if (prop === "getBatches") return () => Promise.resolve({ data: [] });
      if (prop === "getIngredients") return () => Promise.resolve({ data: [] });
      if (prop === "getRecipes") return () => Promise.resolve({ data: [] });
      return defaultResponse;
    },
  };

  const sdk: any = {
    client: {
      getBaseURL: () => config.baseURL,
      setBaseURL: (url: string) => {
        config.baseURL = url;
      },
      get: defaultResponse,
      post: defaultResponse,
      put: defaultResponse,
      patch: defaultResponse,
      delete: defaultResponse,
    },
    setApiKey: (key: string) => {},
  };

  sdk.bakery = new Proxy({}, proxyHandler);
  sdk.catalog = new Proxy({}, proxyHandler);
  sdk.inventory = new Proxy({}, proxyHandler);
  sdk.pos = new Proxy({}, proxyHandler);
  sdk.auth = new Proxy({}, proxyHandler);

  return sdk;
};

export type BakeryBatchListResponse = { data: any[] };
export type Product = any;
export type ProductType = any;
export type ProductVariant = any;
export type MemberRole = any;
export type BakeryBranding = any;
