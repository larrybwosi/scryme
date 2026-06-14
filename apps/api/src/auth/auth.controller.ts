import { Controller, All, Req, Res } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All("*")
  async handleAuth(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.hostname;
    const url = `${protocol}://${host}${req.raw.url}`;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const response = await this.authService.auth.handler(request);

    // Copy headers to fastify response
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
      return res.send(await response.json());
    }

    return res.send();
  }
}
