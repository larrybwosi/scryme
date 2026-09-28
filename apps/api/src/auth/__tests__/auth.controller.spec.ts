import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthApi = {
    getSession: vi.fn(),
  };

  const mockAuthHandler = vi.fn();

  const mockAuthService = {
    auth: {
      api: mockAuthApi,
      handler: mockAuthHandler,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
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
        user: { id: "user-456", email: "admin@example.com", name: "Admin User" },
        session: { id: "sess-456", token: "valid-session-token" },
      };
      mockAuthApi.getSession.mockResolvedValue(mockSession);

      const req = {
        headers: {
          authorization: "Bearer valid-session-token",
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
      const mockResponseBody = JSON.stringify({ success: true, user: { id: "user-456" } });
      const mockBetterAuthResponse = {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ success: true, user: { id: "user-456" } }),
        text: vi.fn().mockResolvedValue(mockResponseBody),
        body: true,
      };

      mockAuthHandler.mockResolvedValue(mockBetterAuthResponse);

      const req = {
        method: "POST",
        protocol: "http",
        hostname: "localhost",
        raw: { url: "/api/auth/sign-in/email" },
        headers: { "content-type": "application/json" },
        body: { email: "admin@example.com", password: "test-password" },
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
      expect(resSend).toHaveBeenCalledWith({ success: true, user: { id: "user-456" } });
    });
  });

    it("should handle SSO authentication requests from auth app", async () => {
      const mockSsoResponse = {
        url: "https://idp.example.com/sso/authorize",
        redirect: true,
      };
      const mockBetterAuthResponse = {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(mockSsoResponse),
        text: vi.fn().mockResolvedValue(JSON.stringify(mockSsoResponse)),
        body: true,
      };

      mockAuthHandler.mockResolvedValue(mockBetterAuthResponse);

      const req = {
        method: "POST",
        protocol: "http",
        hostname: "localhost",
        raw: { url: "/auth/sso/authorize" },
        headers: { "content-type": "application/json", origin: "http://localhost:4444" },
        body: { domain: "acme.com", callbackURL: "http://localhost:3000" },
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
      expect(resSend).toHaveBeenCalledWith(mockSsoResponse);
    });
  });
});
