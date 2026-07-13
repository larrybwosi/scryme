import { Controller, Get, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AllowPublic } from "../common/decorators/auth.decorator";
import {
  oauthProviderOpenIdConfigMetadata,
  oauthProviderAuthServerMetadata,
} from "@repo/auth/nest";

@Controller(".well-known")
export class WellKnownController {
  constructor(private readonly authService: AuthService) {}

  @AllowPublic()
  @Get("openid-configuration")
  async getOpenIdConfiguration(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.hostname;
    const url = `${protocol}://${host}${req.raw.url}`;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
    });

    const handler = oauthProviderOpenIdConfigMetadata(this.authService.auth);
    const response = await handler(request);

    // Copy headers to fastify response
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return res.send(await response.json());
      }
      return res.send(await response.text());
    }

    return res.send();
  }

  @AllowPublic()
  @Get("oauth-authorization-server")
  async getOAuthAuthorizationServer(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.hostname;
    const url = `${protocol}://${host}${req.raw.url}`;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
    });

    const handler = oauthProviderAuthServerMetadata(this.authService.auth);
    const response = await handler(request);

    // Copy headers to fastify response
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return res.send(await response.json());
      }
      return res.send(await response.text());
    }

    return res.send();
  }

  @AllowPublic()
  @Get("oauth-authorization-server/:issuerPath")
  async getOAuthAuthorizationServerWithIssuer(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.hostname;
    const url = `${protocol}://${host}${req.raw.url}`;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
    });

    const handler = oauthProviderAuthServerMetadata(this.authService.auth);
    const response = await handler(request);

    // Copy headers to fastify response
    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    res.status(response.status);

    if (response.body) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return res.send(await response.json());
      }
      return res.send(await response.text());
    }

    return res.send();
  }
}
