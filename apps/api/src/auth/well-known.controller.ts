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

    const handler = oauthProviderOpenIdConfigMetadata(this.authService.auth as any);
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

    const handler = oauthProviderAuthServerMetadata(this.authService.auth as any);
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

    const handler = oauthProviderAuthServerMetadata(this.authService.auth as any);
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
  @Get("assetlinks.json")
  async getAssetLinks(@Res() res: any) {
    const assetLinks = [
      {
        relation: [
          "delegate_permission/common.handle_all_urls",
          "delegate_permission/common.get_login_creds",
        ],
        target: {
          namespace: "android_app",
          package_name: "tech.scryme.app",
          sha256_cert_fingerprints: process.env.ANDROID_SHA256_FINGERPRINTS
            ? process.env.ANDROID_SHA256_FINGERPRINTS.split(",").map((fp) => fp.trim())
            : [
                "10:5B:AA:89:FE:E0:4F:2F:DF:01:E6:BC:54:AC:F1:C8:B3:34:6F:A5:A8:16:DF:EC:60:8E:EE:48:8B:BC:FA:21",
              ],
        },
      },
    ];
    res.header("content-type", "application/json");
    return res.send(assetLinks);
  }
}
