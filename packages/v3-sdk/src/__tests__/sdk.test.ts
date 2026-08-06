import { createClientSDK } from "../client";
import { createServerSDK } from "../server";
import axios from "axios";

jest.mock("axios", () => {
  return {
    create: jest.fn(() => ({
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    })),
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
  });

  describe("Client SDK statefulness & reactivity", () => {
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
});
