import { Controller, All, Req, Res, Get } from "@nestjs/common";
import { CustomerAuthService } from "./customer-auth.service";
import { AllowPublic } from "../common/decorators/auth.decorator";

@AllowPublic()
@Controller("customer-auth")
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Get("session")
  async getSession(@Req() req: any, @Res() res: any) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value as string);
        }
      }
    }

    const session = await this.customerAuthService.auth.api.getSession({
      headers,
    });
    if (!session) {
      return res.status(401).send({ error: "Unauthorized" });
    }
    return res.send(session);
  }

  @All("*")
  async handleAuth(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.headers.host || req.hostname;
    const url = `${protocol}://${host}${req.raw.url}`;

    const headers = new Headers(req.headers as HeadersInit);

    let body: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      const contentType = headers.get("content-type");
      if (contentType?.includes("application/x-www-form-urlencoded")) {
        if (typeof req.body === "string") {
          body = req.body;
        } else {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(req.body)) {
            params.append(key, value as string);
          }
          body = params.toString();
        }
      } else if (contentType?.includes("application/json")) {
        body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      } else {
        body = req.body;
      }
    }

    const request = new Request(url, {
      method: req.method,
      headers: headers,
      body: body,
    });

    const response = await this.customerAuthService.auth.handler(request);

    // Copy headers to fastify response
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          const json = await response.json();
          if (json && json.session) {
            // Find/extract the token
            let token = response.headers.get("set-auth-token");
            if (!token) {
              const setCookie = response.headers.get("set-cookie");
              if (setCookie) {
                const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
                if (match) {
                  token = match[1];
                }
              }
            }
            if (!token && typeof response.headers.getSetCookie === "function") {
              const cookies = response.headers.getSetCookie();
              for (const cookie of cookies) {
                const match = cookie.match(/better-auth\.session_token=([^;]+)/);
                if (match) {
                  token = match[1];
                  break;
                }
              }
            }
            if (!token) {
              const authHeader = req.headers["authorization"] || req.headers["Authorization"];
              if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
              }
            }
            if (token) {
              json.session.token = token;
            }
          }
          return res.send(json);
        } catch (e) {
          // Fallback to text if JSON parsing fails
        }
      }
      return res.send(await response.text());
    }

    return res.send();
  }
}
