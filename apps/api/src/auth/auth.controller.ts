import { Controller, All, Req, Res } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service";
import { AllowPublic } from "../common/decorators/auth.decorator";

@AllowPublic()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All("*")
  async handleAuth(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.hostname;
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

    const response = await this.authService.auth.handler(request);

    // Copy headers to fastify response
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          return res.send(await response.json());
        } catch (e) {
          // Fallback to text if JSON parsing fails
        }
      }
      return res.send(await response.text());
    }

    return res.send();
  }
}
