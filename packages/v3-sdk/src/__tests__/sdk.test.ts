import { ScrymeClientSDK, createClientSDK } from "../client";
import { ScrymeServerSDK, createServerSDK } from "../server";
import axios from "axios";

jest.mock("axios", () => {
  const createMockInstance = () => {
    const mockInstance: any = jest.fn(() => Promise.resolve({ data: {} }));
    mockInstance.defaults = {
      headers: {
        common: {},
      },
    };
    mockInstance.interceptors = {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    };
    mockInstance.get = jest.fn();
    mockInstance.post = jest.fn();
    mockInstance.put = jest.fn();
    mockInstance.patch = jest.fn();
    mockInstance.delete = jest.fn();
    return mockInstance;
  };

  return {
    create: jest.fn(() => createMockInstance()),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
});

describe("Scryme V3 Client and Server SDKs", () => {
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
  });

  describe("Validation Checks during Initialization", () => {
    it("should throw a runtime error if required parameters are missing in ScrymeServerSDK", () => {
      expect(() => {
        new ScrymeServerSDK({} as any);
      }).toThrow("clientId, clientSecret, and orgSlug are required to initialize the SDK.");

      expect(() => {
        new ScrymeServerSDK({ clientId: "id", clientSecret: "secret" } as any);
      }).toThrow("clientId, clientSecret, and orgSlug are required to initialize the SDK.");
    });

    it("should throw a runtime error if required parameters are missing in ScrymeClientSDK", () => {
      expect(() => {
        new ScrymeClientSDK({} as any);
      }).toThrow("clientId, clientSecret, and orgSlug are required to initialize the SDK.");

      expect(() => {
        new ScrymeClientSDK({ clientId: "id", orgSlug: "slug" } as any);
      }).toThrow("clientId, clientSecret, and orgSlug are required to initialize the SDK.");
    });
  });

  describe("Class-based Submodules & Prefix Stripping", () => {
    it("should map catalog, inventory, crm, etc. with correct prefix stripping and orgSlug injection", async () => {
      const sdk = new ScrymeServerSDK({
        clientId: "my-id",
        clientSecret: "my-secret",
        orgSlug: "test-org-123",
      });

      // Mock catalogGetProducts response as an array of products
      const mockProducts = [{ id: "p1", name: "Product 1" }];
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockProducts,
      });

      // Call mapped method without orgSlug!
      const response = await sdk.catalog.getProducts({ limit: 10 });

      // Ensure axios was called with the correct URL including the automatically injected orgSlug
      expect(sdk.axiosInstance.get).toHaveBeenCalledWith("/v3/test-org-123/catalog/products", {
        params: { limit: 10 },
      });
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data[0].id).toBe("p1");
    });

    it("should map CRM methods correctly and auto-inject orgSlug", async () => {
      const sdk = new ScrymeServerSDK({
        clientId: "my-id",
        clientSecret: "my-secret",
        orgSlug: "test-org-123",
      });

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "record-id-456" },
      });

      // crm.createRecord maps to crmControllerCreateRecord
      await sdk.crm.createRecord({
        objectId: "obj-1",
        data: { name: "deal" },
      });

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/test-org-123/crm/records",
        {
          objectId: "obj-1",
          data: { name: "deal" },
        },
        undefined
      );
    });
  });

  describe("Server SDK isolation", () => {
    it("should instantiate a Server SDK with custom configs and not pollute other instances", () => {
      const sdk1 = createServerSDK({
        baseURL: "https://api1.test",
        token: "token123",
      });

      const sdk2 = createServerSDK({
        baseURL: "https://api2.test",
        apiKey: "api-key-999",
      });

      expect(axios.create).toHaveBeenCalledTimes(2);

      // Verify that sdk1 and sdk2 are isolated instances
      expect(sdk1.axiosInstance).not.toBe(sdk2.axiosInstance);

      // Verify defaults
      expect(sdk1.axiosInstance.defaults.headers.common["Authorization"]).toBe("Bearer token123");
      expect(sdk1.axiosInstance.defaults.headers.common["x-api-key"]).toBeUndefined();

      expect(sdk2.axiosInstance.defaults.headers.common["Authorization"]).toBeUndefined();
      expect(sdk2.axiosInstance.defaults.headers.common["x-api-key"]).toBe("api-key-999");
    });

    it("should support authenticate using clientId and clientSecret and attach to default headers", async () => {
      const sdk = createServerSDK({
        clientId: "srv_client_id",
        clientSecret: "srv_client_secret",
      });

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: "server_jwt_token_abc",
            token_type: "Bearer",
            expires_in: 3600
          },
          timestamp: new Date().toISOString()
        }
      });

      const tokenData = await sdk.auth.authenticate();
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith("/v3/auth/token", {
        clientId: "srv_client_id",
        clientSecret: "srv_client_secret",
      }, undefined);

      expect(tokenData.data.access_token).toBe("server_jwt_token_abc");
      expect(sdk.axiosInstance.defaults.headers.common["Authorization"]).toBe("Bearer server_jwt_token_abc");
    });
  });

  describe("Client SDK statefulness & reactivity", () => {
    it("should default orgSlug correctly when omitted from api calls using configured orgSlug", async () => {
      const sdk = createClientSDK({
        orgSlug: "configured-test-org",
      });

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: []
      });

      await (sdk.api.inventoryGetInventory as any)({ limit: 10 });
      expect(sdk.axiosInstance.get).toHaveBeenCalledWith("/v3/configured-test-org/inventory", {
        params: { limit: 10 }
      });
    });

    it("should support authenticate method using clientId and clientSecret", async () => {
      const sdk = createClientSDK({
        clientId: "my_client_id_777",
        clientSecret: "my_client_secret_888",
        storage: mockStorage,
      });

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: "client_jwt_token_xyz",
            token_type: "Bearer",
            expires_in: 3600
          },
          timestamp: new Date().toISOString()
        }
      });

      const tokenData = await sdk.auth.authenticate();
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith("/v3/auth/token", {
        clientId: "my_client_id_777",
        clientSecret: "my_client_secret_888",
      }, undefined);

      expect(tokenData.data.access_token).toBe("client_jwt_token_xyz");
      expect(mockStorage.setItem).toHaveBeenCalledWith("scryme_session_token", "client_jwt_token_xyz");

      const session = await sdk.auth.getSession();
      expect(session.token).toBe("client_jwt_token_xyz");
    });

    it("should recover previous session from Storage and configure interceptor", async () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === "scryme_session_token") return "saved_token_777";
        if (key === "scryme_user") return JSON.stringify({ id: "user_1", name: "Alice" });
        return null;
      });

      const sdk = createClientSDK({
        baseURL: "https://api-client.test",
        storage: mockStorage,
      });

      // Retrieve loaded session
      const session = await sdk.auth.getSession();
      expect(session.token).toBe("saved_token_777");
      expect(session.user).toEqual({ id: "user_1", name: "Alice" });

      expect(mockStorage.getItem).toHaveBeenCalledWith("scryme_session_token");
      expect(mockStorage.getItem).toHaveBeenCalledWith("scryme_user");
    });

    it("should support auth event listeners via onAuthStateChange", async () => {
      mockStorage.getItem.mockResolvedValue(null);

      const sdk = createClientSDK({
        baseURL: "https://api-client.test",
        storage: mockStorage,
      });

      const callback = jest.fn();
      sdk.auth.onAuthStateChange(callback);

      // Initial call with loaded state (null on clean run)
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledWith("INITIAL_SESSION", { token: null, user: null });

      // Simulate sign in response
      const mockSignInResponse = {
        session: { token: "new_token_888" },
        user: { id: "user_2", name: "Bob" },
      };
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockSignInResponse,
      });

      await sdk.auth.signIn({ email: "bob@test.com", password: "pwd" });

      expect(mockStorage.setItem).toHaveBeenCalledWith("scryme_session_token", "new_token_888");
      expect(mockStorage.setItem).toHaveBeenCalledWith("scryme_user", JSON.stringify({ id: "user_2", name: "Bob" }));

      // listener should be notified of SIGNED_IN
      expect(callback).toHaveBeenCalledWith("SIGNED_IN", {
        token: "new_token_888",
        user: { id: "user_2", name: "Bob" },
      });

      // Simulate sign out
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({});
      await sdk.auth.signOut();

      expect(mockStorage.removeItem).toHaveBeenCalledWith("scryme_session_token");
      expect(mockStorage.removeItem).toHaveBeenCalledWith("scryme_user");

      // listener should be notified of SIGNED_OUT
      expect(callback).toHaveBeenCalledWith("SIGNED_OUT", {
        token: null,
        user: null,
      });
    });
  });

  describe("Automated token exchange, refresh, and deduplication", () => {
    it("should proactively perform token exchange on standard requests if no token is present", async () => {
      const sdk = createClientSDK({
        clientId: "auto_client_id",
        clientSecret: "auto_client_secret",
        orgSlug: "test-org",
        storage: mockStorage,
      });

      // Mock authExchangeToken response
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: "proactive_auto_token",
            token_type: "Bearer",
            expires_in: 3600,
          },
        },
      });

      // Mock catalogGetProducts response
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: [{ id: "p1" }],
      });

      // Trigger the request interceptor manually by simulating a request
      const requestConfig = { url: "/v3/test-org/catalog/products", headers: {} as any };
      const requestInterceptor = (sdk.axiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];

      const modifiedConfig = await requestInterceptor(requestConfig);

      // Verify that the token exchange was called with correct credentials
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith("/v3/auth/token", {
        clientId: "auto_client_id",
        clientSecret: "auto_client_secret",
      }, undefined);

      // Verify token is attached
      expect(modifiedConfig.headers["Authorization"]).toBe("Bearer proactive_auto_token");
    });

    it("should reactively perform token exchange and retry on 401 Unauthorized", async () => {
      const sdk = createClientSDK({
        clientId: "auto_client_id",
        clientSecret: "auto_client_secret",
        orgSlug: "test-org",
        storage: mockStorage,
      });

      // Mock token exchange
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: "reactive_auto_token",
            token_type: "Bearer",
            expires_in: 3600,
          },
        },
      });

      // Mock retry request success
      const mockRetriedResponse = { data: "success_after_retry" };
      (sdk.axiosInstance as unknown as jest.Mock).mockResolvedValueOnce(mockRetriedResponse);

      const responseInterceptorError = (sdk.axiosInstance.interceptors.response.use as jest.Mock).mock.calls[0][1];

      const originalRequestConfig = { url: "/v3/test-org/catalog/products", headers: {} as any };
      const mockError = {
        response: { status: 401 },
        config: originalRequestConfig,
      };

      const result = await responseInterceptorError(mockError);

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith("/v3/auth/token", {
        clientId: "auto_client_id",
        clientSecret: "auto_client_secret",
      }, undefined);

      expect(originalRequestConfig.headers["Authorization"]).toBe("Bearer reactive_auto_token");
      expect(result).toBe(mockRetriedResponse);
    });

    it("should deduplicate concurrent token exchange requests and share the promise", async () => {
      const sdk = createClientSDK({
        clientId: "auto_client_id",
        clientSecret: "auto_client_secret",
        orgSlug: "test-org",
        storage: mockStorage,
      });

      // Mock token exchange with a slow resolving promise
      let resolveExchange: any;
      const exchangePromise = new Promise((resolve) => {
        resolveExchange = resolve;
      });

      (sdk.axiosInstance.post as jest.Mock).mockImplementation((url, data) => {
        if (url === "/v3/auth/token") {
          return exchangePromise;
        }
        return Promise.resolve({ data: [] });
      });

      const requestInterceptor = (sdk.axiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];

      // Fire multiple requests concurrently
      const req1Promise = requestInterceptor({ url: "/v3/test-org/catalog/products", headers: {} as any });
      const req2Promise = requestInterceptor({ url: "/v3/test-org/catalog/products", headers: {} as any });

      // Resolve the token exchange now
      resolveExchange({
        data: {
          success: true,
          data: {
            access_token: "shared_deduped_token",
            token_type: "Bearer",
            expires_in: 3600,
          },
        },
      });

      const [config1, config2] = await Promise.all([req1Promise, req2Promise]);

      // Ensure that post was only called ONCE for the /v3/auth/token endpoint
      const tokenTokenCalls = (sdk.axiosInstance.post as jest.Mock).mock.calls.filter(call => call[0] === "/v3/auth/token");
      expect(tokenTokenCalls.length).toBe(1);

      // Both requests should have received the exact same token
      expect(config1.headers["Authorization"]).toBe("Bearer shared_deduped_token");
      expect(config2.headers["Authorization"]).toBe("Bearer shared_deduped_token");
    });
  });

  describe("Client/Server SDK Separate Mappings & Security", () => {
    it("should allow client-side SDK to query public service endpoints and omit admin actions", () => {
      const clientSdk = createClientSDK({
        clientId: "client-id",
        clientSecret: "client-secret",
        orgSlug: "test-org",
      });

      // Verify that public methods exist on client.services
      expect(clientSdk.services.listServices).toBeDefined();
      expect(clientSdk.services.getCategories).toBeDefined();
      expect(clientSdk.services.getService).toBeDefined();
      expect(clientSdk.services.getAvailability).toBeDefined();
      expect(clientSdk.services.requestOtp).toBeDefined();
      expect(clientSdk.services.verifyOtp).toBeDefined();
      expect(clientSdk.services.createBooking).toBeDefined();

      // Verify that administrative methods do NOT exist on client.services
      expect((clientSdk.services as any).createCategory).toBeUndefined();
      expect((clientSdk.services as any).updateCategory).toBeUndefined();
      expect((clientSdk.services as any).deleteCategory).toBeUndefined();
      expect((clientSdk.services as any).createService).toBeUndefined();
      expect((clientSdk.services as any).updateService).toBeUndefined();
      expect((clientSdk.services as any).deleteService).toBeUndefined();
      expect((clientSdk.services as any).createShift).toBeUndefined();
      expect((clientSdk.services as any).addBreak).toBeUndefined();
    });

    it("should allow server-side SDK to access both public and administrative endpoints", () => {
      const serverSdk = createServerSDK({
        clientId: "server-id",
        clientSecret: "server-secret",
        orgSlug: "test-org",
      });

      // Public endpoints should still be accessible on server.services
      expect(serverSdk.services.listServices).toBeDefined();
      expect(serverSdk.services.getCategories).toBeDefined();
      expect(serverSdk.services.getService).toBeDefined();
      expect(serverSdk.services.getAvailability).toBeDefined();
      expect(serverSdk.services.requestOtp).toBeDefined();
      expect(serverSdk.services.verifyOtp).toBeDefined();
      expect(serverSdk.services.createBooking).toBeDefined();

      // Administrative endpoints must also be accessible on server.services
      expect(serverSdk.services.createCategory).toBeDefined();
      expect(serverSdk.services.updateCategory).toBeDefined();
      expect(serverSdk.services.deleteCategory).toBeDefined();
      expect(serverSdk.services.createService).toBeDefined();
      expect(serverSdk.services.updateService).toBeDefined();
      expect(serverSdk.services.deleteService).toBeDefined();
      expect(serverSdk.services.createShift).toBeDefined();
      expect(serverSdk.services.addBreak).toBeDefined();
    });
  });
});
