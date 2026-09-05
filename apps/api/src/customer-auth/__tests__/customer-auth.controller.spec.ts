import { Test, TestingModule } from "@nestjs/testing";
import { CustomerAuthController } from "../customer-auth.controller";
import { CustomerAuthService } from "../customer-auth.service";

describe("CustomerAuthController", () => {
  let controller: CustomerAuthController;
  let service: CustomerAuthService;

  const mockAuthApi = {
    getSession: vi.fn(),
  };

  const mockAuthHandler = vi.fn();

  const mockCustomerAuthService = {
    auth: {
      api: mockAuthApi,
      handler: mockAuthHandler,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerAuthController],
      providers: [
        {
          provide: CustomerAuthService,
          useValue: mockCustomerAuthService,
        },
      ],
    }).compile();

    controller = module.get<CustomerAuthController>(CustomerAuthController);
    service = module.get<CustomerAuthService>(CustomerAuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getSession", () => {
    it("should return 401 status when session is not found", async () => {
      mockAuthApi.getSession.mockResolvedValue(null);

      const req = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };

      const resSend = vi.fn();
      const resStatus = vi.fn().mockReturnValue({ send: resSend });
      const res = { status: resStatus };

      await controller.getSession(req, res);

      expect(mockAuthApi.getSession).toHaveBeenCalled();
      expect(resStatus).toHaveBeenCalledWith(401);
      expect(resSend).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return active session payload when valid token is provided", async () => {
      const mockSession = {
        user: { id: "user-123", email: "customer@example.com", name: "Customer User" },
        session: { id: "sess-123", token: "valid-token" },
      };
      mockAuthApi.getSession.mockResolvedValue(mockSession);

      const req = {
        headers: {
          authorization: "Bearer valid-token",
        },
      };

      const resSend = vi.fn();
      const res = { send: resSend };

      await controller.getSession(req, res);

      expect(mockAuthApi.getSession).toHaveBeenCalled();
      expect(resSend).toHaveBeenCalledWith(mockSession);
    });
  });

  describe("handleAuth", () => {
    it("should process auth request and forward better-auth response", async () => {
      const mockResponseBody = JSON.stringify({ success: true, user: { id: "user-123" } });
      const mockBetterAuthResponse = {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ success: true, user: { id: "user-123" } }),
        text: vi.fn().mockResolvedValue(mockResponseBody),
        body: true,
      };

      mockAuthHandler.mockResolvedValue(mockBetterAuthResponse);

      const req = {
        method: "POST",
        protocol: "http",
        hostname: "localhost",
        raw: { url: "/api/customer-auth/sign-in/email" },
        headers: { "content-type": "application/json" },
        body: { email: "customer@example.com", password: "password123" },
      };

      const resHeader = vi.fn();
      const resStatus = vi.fn();
      const resSend = vi.fn();
      const res = {
        header: resHeader,
        status: resStatus,
        send: resSend,
      };

      await controller.handleAuth(req, res);

      expect(mockAuthHandler).toHaveBeenCalled();
      expect(resStatus).toHaveBeenCalledWith(200);
      expect(resSend).toHaveBeenCalledWith({ success: true, user: { id: "user-123" } });
    });
  });
});
