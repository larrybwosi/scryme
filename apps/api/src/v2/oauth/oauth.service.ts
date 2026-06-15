import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";

@Injectable()
export class OAuthService {
  async issueToken(body: any, contentType: string) {
    let grant_type: string | null = null;
    let client_id: string | null = null;
    let client_secret: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // In NestJS, @Body() for urlencoded is already a parsed object
      grant_type = body.grant_type;
      client_id = body.client_id;
      client_secret = body.client_secret;
    } else {
      grant_type = body.grant_type ?? null;
      client_id = body.client_id ?? null;
      client_secret = body.client_secret ?? null;
    }

    if (grant_type !== "client_credentials") {
      throw new BadRequestException({
        error: "unsupported_grant_type",
        error_description: "Only client_credentials is supported",
      });
    }

    if (!client_id || !client_secret) {
      throw new BadRequestException({
        error: "invalid_request",
        error_description: "client_id and client_secret are required",
      });
    }

    const {issueV2Token} = await import("@/lib/api/v2/middleware");
    try {
      const tokenResponse = await issueV2Token(client_id, client_secret);

      if (!tokenResponse) {
        throw new UnauthorizedException({
          error: "invalid_client",
          error_description: "Invalid client credentials",
        });
      }

      return tokenResponse;
    } catch (error) {
      throw new UnauthorizedException({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
    }
  }
}
