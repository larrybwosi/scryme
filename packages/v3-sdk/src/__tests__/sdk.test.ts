import React from "react";
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
      }).toThrow(
        "clientId, clientSecret, and orgSlug are required to initialize the SDK.",
      );

      expect(() => {
        new ScrymeServerSDK({ clientId: "id", clientSecret: "secret" } as any);
      }).toThrow(
        "clientId, clientSecret, and orgSlug are required to initialize the SDK.",
      );
    });

    it("should throw a runtime error if required parameters are missing in ScrymeClientSDK", () => {
      expect(() => {
        new ScrymeClientSDK({} as any);
      }).toThrow("clientId and orgSlug are required to initialize the SDK.");
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
      expect(sdk.axiosInstance.get).toHaveBeenCalledWith(
        "/v3/test-org-123/catalog/products",
        {
          params: { limit: 10 },
        },
      );
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
        undefined,
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
      expect(sdk1.axiosInstance.defaults.headers.common["Authorization"]).toBe(
        "Bearer token123",
      );
      expect(
        sdk1.axiosInstance.defaults.headers.common["x-api-key"],
      ).toBeUndefined();

      expect(
        sdk2.axiosInstance.defaults.headers.common["Authorization"],
      ).toBeUndefined();
      expect(sdk2.axiosInstance.defaults.headers.common["x-api-key"]).toBe(
        "api-key-999",
      );
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
            expires_in: 3600,
          },
          timestamp: new Date().toISOString(),
        },
      });

      const tokenData = await sdk.auth.authenticate();
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/auth/token",
        {
          clientId: "srv_client_id",
          clientSecret: "srv_client_secret",
        },
        undefined,
      );

      expect(tokenData.data.access_token).toBe("server_jwt_token_abc");
      expect(sdk.axiosInstance.defaults.headers.common["Authorization"]).toBe(
        "Bearer server_jwt_token_abc",
      );
    });
  });

  describe("Client SDK statefulness & reactivity", () => {
    it("should default orgSlug correctly when omitted from api calls using configured orgSlug", async () => {
      const sdk = createClientSDK({
        orgSlug: "configured-test-org",
      });

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: [],
      });

      await ((sdk as any).api.inventoryGetInventory as any)({ limit: 10 });
      expect(sdk.axiosInstance.get).toHaveBeenCalledWith(
        "/v3/configured-test-org/inventory",
        {
          params: { limit: 10 },
        },
      );
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
            expires_in: 3600,
          },
          timestamp: new Date().toISOString(),
        },
      });

      const tokenData = await sdk.auth.authenticate();
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/auth/token",
        {
          clientId: "my_client_id_777",
          clientSecret: "my_client_secret_888",
        },
        undefined,
      );

      expect(tokenData.data.access_token).toBe("client_jwt_token_xyz");
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "scryme_session_token",
        "client_jwt_token_xyz",
      );

      const session = await sdk.auth.getSession();
      expect(session.token).toBe("client_jwt_token_xyz");
    });

    it("should recover previous session from Storage and configure interceptor", async () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === "scryme_session_token") return "saved_token_777";
        if (key === "scryme_user")
          return JSON.stringify({ id: "user_1", name: "Alice" });
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
      expect(callback).toHaveBeenCalledWith("INITIAL_SESSION", {
        token: null,
        user: null,
      });

      // Simulate sign in response
      const mockSignInResponse = {
        token: "new_token_888",
        session: { id: "user_2", name: "Bob" },
      };
      (axios.post as jest.Mock).mockRejectedValueOnce(
        new Error("First login failed"),
      );
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockSignInResponse,
      });

      await sdk.auth.signIn({ email: "bob@test.com", password: "pwd" });

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "scryme_session_token",
        "new_token_888",
      );
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "scryme_user",
        JSON.stringify({ id: "user_2", name: "Bob" }),
      );

      // listener should be notified of SIGNED_IN
      expect(callback).toHaveBeenCalledWith("SIGNED_IN", {
        token: "new_token_888",
        user: { id: "user_2", name: "Bob" },
      });

      // Simulate sign out
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({});
      await sdk.auth.signOut();

      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "scryme_session_token",
      );
      expect(mockStorage.removeItem).toHaveBeenCalledWith("scryme_user");

      // listener should be notified of SIGNED_OUT
      expect(callback).toHaveBeenCalledWith("SIGNED_OUT", {
        token: null,
        user: null,
      });
    });

    it("should return the correct session structure synchronously using the session getter", async () => {
      const sdk = createClientSDK({
        storage: mockStorage,
      });

      // Initially no session
      expect(sdk.customer.auth.session).toEqual({
        data: null,
        isPending: false,
        error: null,
      });
      expect(sdk.auth.session).toEqual({
        data: null,
        isPending: false,
        error: null,
      });

      // Sign in to establish session
      const mockSignInResponse = {
        token: "session_token_123",
        session: { id: "cust_123", name: "Alice" },
      };
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockSignInResponse,
      });

      await sdk.customer.auth.signIn({ email: "alice@test.com", password: "pwd" });

      const expectedSession = {
        data: {
          session: {
            id: "cust_123",
            userId: "cust_123",
            expiresAt: null,
            token: "session_token_123",
          },
          user: { id: "cust_123", name: "Alice" },
        },
        isPending: false,
        error: null,
      };

      expect(sdk.customer.auth.session).toEqual(expectedSession);
      expect(sdk.auth.session).toEqual(expectedSession);
    });

    it("should reactively update when using the useSession hook", async () => {
      const sdk = createClientSDK({
        storage: mockStorage,
      });

      // Mock React's useState and useEffect to test useSession in isolation
      const originalUseState = React.useState;
      const originalUseEffect = React.useEffect;

      let stateVal: any;
      let stateSetter: any;

      const mockUseState = jest.fn((init) => {
        const val = typeof init === "function" ? init() : init;
        stateVal = val;
        stateSetter = jest.fn((newVal) => {
          stateVal = typeof newVal === "function" ? newVal(stateVal) : newVal;
        });
        return [stateVal, stateSetter];
      });

      const mockUseEffect = jest.fn((effect) => {
        effect();
      });

      jest.spyOn(React, "useState").mockImplementation(mockUseState as any);
      jest.spyOn(React, "useEffect").mockImplementation(mockUseEffect as any);

      try {
        const sessionResult = sdk.customer.auth.useSession();
        expect(sessionResult).toEqual({
          data: null,
          isPending: false,
          error: null,
          refetch: expect.any(Function),
        });

        // Sign in
        const mockSignInResponse = {
          token: "session_token_456",
          session: { id: "cust_456", name: "Bob" },
        };
        (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
          data: mockSignInResponse,
        });

        await sdk.customer.auth.signIn({ email: "bob@test.com", password: "pwd" });

        // The stateSetter should have been called with the new session
        expect(stateSetter).toHaveBeenCalled();
      } finally {
        React.useState = originalUseState;
        React.useEffect = originalUseEffect;
      }
    });

    it("should automatically sign in after calling signUp if a password is provided", async () => {
      const sdk = createClientSDK({
        storage: mockStorage,
        orgSlug: "test-org-signUp",
      });

      // Mock register request returning customer profile
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "cust_new_789", name: "New User", email: "new@test.com" },
      });

      // Mock login request
      const mockLoginResponse = {
        token: "session_token_signup_789",
        session: { id: "cust_new_789", name: "New User" },
      };
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockLoginResponse,
      });

      await sdk.customer.auth.signUp({
        name: "New User",
        email: "new@test.com",
        password: "password123",
      });

      // Should automatically login and populate the session
      expect(sdk.customer.auth.session.data?.session.token).toBe("session_token_signup_789");
      expect(sdk.customer.auth.session.data?.user).toEqual({ id: "cust_new_789", name: "New User" });
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
      const requestConfig = {
        url: "/v3/test-org/catalog/products",
        headers: {} as any,
      };
      const requestInterceptor = (
        sdk.axiosInstance.interceptors.request.use as jest.Mock
      ).mock.calls[0][0];

      const modifiedConfig = await requestInterceptor(requestConfig);

      // Verify that the token exchange was called with correct credentials
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/auth/token",
        {
          clientId: "auto_client_id",
          clientSecret: "auto_client_secret",
        },
        undefined,
      );

      // Verify token is attached
      expect(modifiedConfig.headers["Authorization"]).toBe(
        "Bearer proactive_auto_token",
      );
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
      (sdk.axiosInstance as unknown as jest.Mock).mockResolvedValueOnce(
        mockRetriedResponse,
      );

      const responseInterceptorError = (
        sdk.axiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];

      const originalRequestConfig = {
        url: "/v3/test-org/catalog/products",
        headers: {} as any,
      };
      const mockError = {
        response: { status: 401 },
        config: originalRequestConfig,
      };

      const result = await responseInterceptorError(mockError);

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/auth/token",
        {
          clientId: "auto_client_id",
          clientSecret: "auto_client_secret",
        },
        undefined,
      );

      expect(originalRequestConfig.headers["Authorization"]).toBe(
        "Bearer reactive_auto_token",
      );
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

      const requestInterceptor = (
        sdk.axiosInstance.interceptors.request.use as jest.Mock
      ).mock.calls[0][0];

      // Fire multiple requests concurrently
      const req1Promise = requestInterceptor({
        url: "/v3/test-org/catalog/products",
        headers: {} as any,
      });
      const req2Promise = requestInterceptor({
        url: "/v3/test-org/catalog/products",
        headers: {} as any,
      });

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
      const tokenTokenCalls = (
        sdk.axiosInstance.post as jest.Mock
      ).mock.calls.filter((call) => call[0] === "/v3/auth/token");
      expect(tokenTokenCalls.length).toBe(1);

      // Both requests should have received the exact same token
      expect(config1.headers["Authorization"]).toBe(
        "Bearer shared_deduped_token",
      );
      expect(config2.headers["Authorization"]).toBe(
        "Bearer shared_deduped_token",
      );
    });
  });

  describe("Client SDK Stateful Cart Operations", () => {
    it("should support get, add, remove, and clear operations", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      // Mock getCart response
      const mockCart = { items: [{ productId: "p1", quantity: 2 }] };
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: mockCart },
      });

      const getRes = await sdk.cart.get({ sessionId: "sess-123" });
      expect(sdk.axiosInstance.get).toHaveBeenCalledWith("/v3/cart-org/cart", {
        params: { sessionId: "sess-123" },
      });
      expect(getRes.data.data).toEqual(mockCart);

      // Mock addToCart response
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });
      await sdk.cart.add({
        productId: "p1",
        quantity: 3,
        sessionId: "sess-123",
        customerId: "mock-cust-123",
      });
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          productId: "p1",
          quantity: 3,
          sessionId: "sess-123",
          customerId: "mock-cust-123",
        },
        undefined,
      );

      // Mock removeFromCart response
      (sdk.axiosInstance.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });
      await sdk.cart.remove({ productId: "p1", sessionId: "sess-123", customerId: "mock-cust-123" });
      expect(sdk.axiosInstance.delete).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          data: { productId: "p1", sessionId: "sess-123", customerId: "mock-cust-123" },
        },
      );

      // Mock clearCart response
      (sdk.axiosInstance.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });
      await sdk.cart.clear({ sessionId: "sess-123" });
      expect(sdk.axiosInstance.delete).toHaveBeenCalledWith(
        "/v3/cart-org/cart",
        {
          params: { sessionId: "sess-123" },
        },
      );
    });

    it("should calculate difference and call appropriate operations on update", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      // Mock getCart to return an item with quantity 2
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ productId: "p1", quantity: 2 }],
        },
      });

      // Mock addToCart for the diff (+3)
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await sdk.cart.update({
        productId: "p1",
        quantity: 5,
        sessionId: "sess-123",
        customerId: "mock-cust-123",
      });

      // getCart should be called with sessionId
      expect(sdk.axiosInstance.get).toHaveBeenCalledWith("/v3/cart-org/cart", {
        params: { sessionId: "sess-123" },
      });

      // addToCart should be called with diff quantity (5 - 2 = 3)
      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          productId: "p1",
          quantity: 3,
          sessionId: "sess-123",
          customerId: "mock-cust-123",
        },
        undefined,
      );
    });
  });

  describe("Client SDK Dynamic customerId resolution", () => {
    it("should inject customerId from active session on cart.add if not provided", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      // Mock active session with customerId
      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: "session-token",
        user: { customerId: "dynamic-cust-123" },
      });

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await sdk.cart.add({
        productId: "p1",
        quantity: 3,
        sessionId: "sess-123",
      });

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          productId: "p1",
          quantity: 3,
          sessionId: "sess-123",
          customerId: "dynamic-cust-123",
        },
        undefined,
      );
    });

    it("should throw an error on cart.add if customerId not provided and no active session", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: null,
        user: null,
      });

      await expect(
        sdk.cart.add({
          productId: "p1",
          quantity: 3,
          sessionId: "sess-123",
        })
      ).rejects.toThrow("Unauthorized: customerId is required.");
    });

    it("should preserve explicitly provided customerId on cart.add", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await sdk.cart.add({
        productId: "p1",
        quantity: 3,
        sessionId: "sess-123",
        customerId: "explicit-cust-999",
      });

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          productId: "p1",
          quantity: 3,
          sessionId: "sess-123",
          customerId: "explicit-cust-999",
        },
        undefined,
      );
    });

    it("should inject customerId from active session on cart.remove if not provided", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: "session-token",
        user: { id: "dynamic-cust-abc" }, // testing alternate fallback .id
      });

      (sdk.axiosInstance.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await sdk.cart.remove({ productId: "p1", sessionId: "sess-123" });

      expect(sdk.axiosInstance.delete).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          data: {
            productId: "p1",
            sessionId: "sess-123",
            customerId: "dynamic-cust-abc",
          },
        },
      );
    });

    it("should throw an error on cart.remove if customerId not provided and no active session", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: null,
        user: null,
      });

      await expect(
        sdk.cart.remove({ productId: "p1", sessionId: "sess-123" })
      ).rejects.toThrow("Unauthorized: customerId is required.");
    });

    it("should inject customerId from active session on cart.update if not provided", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: "session-token",
        user: { customer: { id: "dynamic-cust-xyz" } }, // testing third fallback .customer.id
      });

      // Mock getCart to return existing item
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ productId: "p1", quantity: 2 }],
        },
      });

      // Mock addToCart for diff (+3)
      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await sdk.cart.update({
        productId: "p1",
        quantity: 5,
        sessionId: "sess-123",
      });

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/cart-org/cart/items",
        {
          productId: "p1",
          quantity: 3,
          sessionId: "sess-123",
          customerId: "dynamic-cust-xyz",
        },
        undefined,
      );
    });

    it("should throw an error on cart.update if customerId not provided and no active session", async () => {
      const sdk = createClientSDK({
        clientId: "cart-client-id",
        orgSlug: "cart-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: null,
        user: null,
      });

      await expect(
        sdk.cart.update({
          productId: "p1",
          quantity: 5,
          sessionId: "sess-123",
        })
      ).rejects.toThrow("Unauthorized: customerId is required.");
    });

    it("should inject customerId from active session on bookings.create if not provided", async () => {
      const sdk = createClientSDK({
        clientId: "bookings-client-id",
        orgSlug: "bookings-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: "session-token",
        user: { customerId: "booking-cust-456" },
      });

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "booking-777" },
      });

      await sdk.bookings.create({
        serviceId: "srv-1",
        scheduledStartTime: "2026-10-15T09:00:00Z",
      });

      expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
        "/v3/bookings-org/services/bookings",
        {
          serviceId: "srv-1",
          scheduledStartTime: "2026-10-15T09:00:00Z",
          customerId: "booking-cust-456",
        },
        undefined,
      );
    });

    it("should throw an error on bookings.create if customerId not provided and no active session", async () => {
      const sdk = createClientSDK({
        clientId: "bookings-client-id",
        orgSlug: "bookings-org",
        storage: mockStorage,
      });

      sdk.auth.getSession = jest.fn().mockResolvedValue({
        token: null,
        user: null,
      });

      await expect(
        sdk.bookings.create({
          serviceId: "srv-1",
          scheduledStartTime: "2026-10-15T09:00:00Z",
        })
      ).rejects.toThrow("Unauthorized: customerId is required.");
    });
  });

  describe("Enriched Submodules for Client and Server", () => {
    describe("Client SDK Enriched Submodules", () => {
      it("should support client cart.getItems and cart.getTotals and cart.mergeGuestCart", async () => {
        const sdk = createClientSDK({
          clientId: "client-id",
          orgSlug: "client-org",
          storage: mockStorage,
        });

        const mockCartResponse = {
          success: true,
          data: {
            items: [
              { productId: "p1", variantId: "v1", quantity: 2 },
              { productId: "p2", variantId: "v2", quantity: 1 },
            ],
          },
        };

        (sdk.axiosInstance.get as jest.Mock).mockResolvedValue(
          mockCartResponse,
        );

        const items = await sdk.cart.getItems();
        expect(items).toEqual(mockCartResponse.data.items);

        const totals = await sdk.cart.getTotals();
        expect(totals.itemsCount).toBe(3);
        expect(totals.items).toEqual(mockCartResponse.data.items);

        await sdk.cart.mergeGuestCart("guest-sess", "cust-123");
        expect(sdk.axiosInstance.get).toHaveBeenLastCalledWith(
          "/v3/client-org/cart",
          {
            params: { sessionId: "guest-sess" },
          },
        );
      });

      it("should support client customer profile and addresses", async () => {
        const sdk = createClientSDK({
          clientId: "client-id",
          orgSlug: "client-org",
          storage: mockStorage,
        });

        // Mock current session loading
        sdk.auth.getSession = jest.fn().mockResolvedValue({
          token: "token123",
          user: { id: "cust-123" },
        });

        // Mock getCurrentSession
        (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: { id: "cust-123", name: "Alice" } },
        });

        const profile = await sdk.customer.getProfile();
        expect(profile).toBeDefined();

        // Mock updateCustomer
        (sdk.axiosInstance.patch as jest.Mock).mockResolvedValueOnce({
          data: { success: true },
        });
        await sdk.customer.updateProfile({ name: "Bob" });
        expect(sdk.axiosInstance.patch).toHaveBeenCalledWith(
          "/v3/client-org/customers/cust-123",
          { name: "Bob" },
          undefined,
        );

        // Mock addresses
        (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
          data: [{ id: "addr-1" }],
        });
        const addresses = await sdk.customer.getAddresses();
        expect(addresses.data).toEqual([{ id: "addr-1" }]);

        // Mock add address
        (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true },
        });
        await sdk.customer.addAddress({
          label: "Office",
          street1: "123 Main St",
          city: "New York",
          country: "USA",
        });
        expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
          "/v3/client-org/customers/cust-123/addresses",
          {
            label: "Office",
            street1: "123 Main St",
            city: "New York",
            country: "USA",
          },
          undefined,
        );
      });

      it("should support client bookings module", async () => {
        const sdk = createClientSDK({
          clientId: "client-id",
          orgSlug: "client-org",
          storage: mockStorage,
        });

        (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
          data: { id: "booking-123" },
        });

        await sdk.bookings.create({
          serviceId: "srv-1",
          scheduledStartTime: "2026-10-15T09:00:00Z",
          customerId: "mock-cust-123",
        });
        expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
          "/v3/client-org/services/bookings",
          {
            serviceId: "srv-1",
            scheduledStartTime: "2026-10-15T09:00:00Z",
            customerId: "mock-cust-123",
          },
          undefined,
        );

        (sdk.axiosInstance.patch as jest.Mock).mockResolvedValueOnce({
          data: { success: true },
        });
        await sdk.bookings.cancel("booking-123");
        expect(sdk.axiosInstance.patch).toHaveBeenCalledWith(
          "/v3/client-org/services/bookings/booking-123/status",
          "CANCELLED",
          undefined,
        );
      });

      it("should support client cart checkout", async () => {
        const sdk = createClientSDK({
          clientId: "client-id",
          orgSlug: "client-org",
          storage: mockStorage,
        });

        sdk.auth.getSession = jest.fn().mockResolvedValue({
          token: "token123",
          user: { id: "cust-123" },
        });

        sdk.cart.getItems = jest
          .fn()
          .mockResolvedValue([{ variantId: "v1", quantity: 2, unitPrice: 10 }]);

        (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: { id: "order-123" } },
        });

        await sdk.cart.checkout({
          locationId: "loc-1",
          notes: "Leave at door",
        });

        expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
          "/v3/client-org/orders",
          {
            customerId: "cust-123",
            locationId: "loc-1",
            items: [{ variantId: "v1", quantity: 2, unitPrice: 10 }],
            notes: "Leave at door",
          },
          undefined,
        );
      });
    });

    describe("Server SDK Enriched Submodules", () => {
      it("should support server cart getItems, getTotals, and update", async () => {
        const sdk = createServerSDK({
          clientId: "server-id",
          clientSecret: "server-secret",
          orgSlug: "server-org",
        });

        const mockCartResponse = {
          success: true,
          data: {
            items: [{ productId: "p1", variantId: "v1", quantity: 1 }],
          },
        };

        (sdk.axiosInstance.get as jest.Mock).mockResolvedValue(
          mockCartResponse,
        );

        const items = await sdk.cart.getItems({ sessionId: "sess-12" });
        expect(items).toEqual(mockCartResponse.data.items);

        const totals = await sdk.cart.getTotals({ sessionId: "sess-12" });
        expect(totals.itemsCount).toBe(1);
      });

      it("should support server customer details access", async () => {
        const sdk = createServerSDK({
          clientId: "server-id",
          clientSecret: "server-secret",
          orgSlug: "server-org",
        });

        (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
          data: { id: "cust-789", name: "Bob" },
        });

        const customer = await sdk.customer.getProfile("cust-789");
        expect(customer.data.id).toBe("cust-789");
        expect(sdk.axiosInstance.get).toHaveBeenCalledWith(
          "/v3/server-org/customers/cust-789",
          undefined,
        );
      });

      it("should support server bookings and complete sensitive operation", async () => {
        const sdk = createServerSDK({
          clientId: "server-id",
          clientSecret: "server-secret",
          orgSlug: "server-org",
        });

        (sdk.axiosInstance.patch as jest.Mock).mockResolvedValueOnce({
          data: { success: true },
        });

        await sdk.bookings.complete("booking-1", { qcData: { pass: true } });
        expect(sdk.axiosInstance.patch).toHaveBeenCalledWith(
          "/v3/server-org/services/bookings/booking-1/complete",
          { qcData: { pass: true } },
          undefined,
        );
      });

      it("should support server cart checkout orchestration", async () => {
        const sdk = createServerSDK({
          clientId: "server-id",
          clientSecret: "server-secret",
          orgSlug: "server-org",
        });

        sdk.cart.getItems = jest
          .fn()
          .mockResolvedValue([{ variantId: "v5", quantity: 3 }]);

        (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
          data: { id: "order-99" },
        });

        await sdk.cart.checkout({
          customerId: "cust-99",
          locationId: "loc-99",
        });

        expect(sdk.axiosInstance.post).toHaveBeenCalledWith(
          "/v3/server-org/orders",
          {
            customerId: "cust-99",
            locationId: "loc-99",
            items: [{ variantId: "v5", quantity: 3 }],
          },
          undefined,
        );
      });
    });
  });

  describe("Generic Type Customization & Auth DX Features", () => {
    interface CustomProduct {
      id: string;
      name: string;
      sku: string;
      customFields: {
        customSlugOverride: string;
        layoutTemplate: string;
        mySpecialCustomAttribute: string;
      };
    }

    interface CustomService {
      id: string;
      name: string;
      customFields: {
        layoutTemplate: string;
        isBookingEnabled: boolean;
      };
    }

    interface CustomUser {
      id: string;
      name: string;
      email: string;
      phone: string;
      customMetadata: {
        roleGroup: string;
        loyaltyTier: string;
      };
    }

    interface CustomSession {
      id: string;
      customerId: string;
      token: string;
      ipAddress: string;
      customDeviceFingerprint: string;
    }

    it("should compile and allow full type-safety with custom Product, Service, User and Session types", async () => {
      // Initialize with our custom generic types
      const sdk = new ScrymeServerSDK<CustomProduct, CustomService, any, any, CustomUser, CustomSession>({
        clientId: "generic-client-id",
        clientSecret: "generic-client-secret",
        orgSlug: "generic-org",
      });

      // Mock catalogGetProducts response to match CustomProduct
      const mockProduct: CustomProduct = {
        id: "p-generic-123",
        name: "Premium Generic Product",
        sku: "PREM-GEN-123",
        customFields: {
          customSlugOverride: "premium-slug",
          layoutTemplate: "grid",
          mySpecialCustomAttribute: "this is fully type-safe!",
        },
      };

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: [mockProduct],
      });

      const response = await sdk.catalog.getProducts();
      const product = response.data[0];

      // Verify that the product has our generic custom field type
      expect(product.id).toBe("p-generic-123");
      expect(product.customFields.mySpecialCustomAttribute).toBe("this is fully type-safe!");

      // Mock auth signIn response
      const mockSignInResponse = {
        token: "session-token-999",
        session: {
          id: "session-123",
          customerId: "cust-123",
          token: "session-token-999",
          ipAddress: "127.0.0.1",
          customDeviceFingerprint: "fingerprint-xyz",
        },
        user: {
          id: "cust-123",
          name: "Alice Smith",
          email: "alice@generic.com",
          phone: "+1234567890",
          customMetadata: {
            roleGroup: "Admin",
            loyaltyTier: "Platinum",
          },
        },
      };

      (sdk.axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockSignInResponse,
      });
const authData = await sdk.auth.signIn({ email: "alice@generic.com", password: "secure" });

      // Verify that auth session and user are fully typed and contain custom properties
      expect(authData.token).toBe("session-token-999");
      expect(authData.session?.customDeviceFingerprint).toBe("fingerprint-xyz");
      expect(authData.user?.customMetadata.loyaltyTier).toBe("Platinum");
    });
  });

  describe("New Features: Singular Product/Service Retrieval and Header-Based Session", () => {
    it("should retrieve a product with reviews, favoritesCount, and dynamic meta calculations", async () => {
      const sdk = createClientSDK({ orgSlug: "test-org" });
      const mockProductWithReviews = {
        id: "prod-rich",
        slug: "rich-product",
        name: "Rich Product",
        brand: "Rich Brand",
        isNew: true,
        detailedDescription: "Extremely rich product details.",
        tags: ["rich", "luxury"],
        reviews: [
          { id: "r1", rating: 5, comment: "Awesome!" },
          { id: "r2", rating: 4, comment: "Nice!" },
        ],
        favoritesCount: 42,
        favouritesCount: 42,
        meta: {
          averageRating: 4.5,
          reviewCount: 2,
        },
      };

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: [mockProductWithReviews],
      });

      const response = await sdk.catalog.getProduct("prod-rich");
      expect(response.data.id).toBe("prod-rich");
      expect(response.data.brand).toBe("Rich Brand");
      expect(response.data.reviews).toHaveLength(2);
      expect(response.data.favoritesCount).toBe(42);
      expect(response.data.favouritesCount).toBe(42);
      expect(response.data.meta?.averageRating).toBe(4.5);
    });

    it("should retrieve a product by ID or slug via getProduct", async () => {
      const sdk = createClientSDK({ orgSlug: "test-org" });
      const mockProducts = [
        { id: "prod-1", slug: "product-one", name: "Product One" },
        { id: "prod-2", slug: "product-two", name: "Product Two" },
      ];
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockProducts,
      });

      const responseById = await sdk.catalog.getProduct("prod-1");
      expect(responseById.data.id).toBe("prod-1");

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockProducts,
      });
      const responseBySlug = await sdk.catalog.getProduct("product-two");
      expect(responseBySlug.data.id).toBe("prod-2");

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockProducts,
      });
      const responseByObj = await sdk.catalog.getProduct({ slug: "product-one" });
      expect(responseByObj.data.id).toBe("prod-1");
    });

    it("should retrieve a service by ID or slug via getService", async () => {
      const sdk = createClientSDK({ orgSlug: "test-org" });
      const mockServices = [
        { id: "srv-1", slug: "service-one", name: "Service One" },
        { id: "srv-2", slug: "service-two", name: "Service Two" },
      ];
      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockServices,
      });

      const responseById = await sdk.catalog.getService("srv-1");
      expect(responseById.data.id).toBe("srv-1");

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockServices,
      });
      const responseBySlug = await sdk.catalog.getService("service-two");
      expect(responseBySlug.data.id).toBe("srv-2");
    });

    it("should forward headers in getCurrentSession for server SDK", async () => {
      const sdk = createServerSDK({ orgSlug: "server-org" });
      const mockSession = { id: "cust-123", name: "Alice" };

      (sdk.axiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockSession,
      });

      const fakeHeaders = { "x-custom-session": "token-xyz" };
      const session = await sdk.customer.auth.getCurrentSession(fakeHeaders);

      expect(sdk.axiosInstance.get).toHaveBeenCalledWith(
        "/server-org/customers/auth/session",
        { headers: fakeHeaders }
      );
      expect(session).toEqual(mockSession);
    });
  });
});
