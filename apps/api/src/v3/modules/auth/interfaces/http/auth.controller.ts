import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Get,
  Req,
  Res,
  Put,
  Delete,
  Patch,
  Head,
  Options,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { AllowPublic } from "../../../../../common/decorators/auth.decorator";
import { ExchangeTokenUseCase } from "../../application/use-cases/exchange-token.use-case";
import {
  TokenRequestDto,
  TokenResponseDto,
} from "../../application/dto/token.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { AuthService } from "@/auth/auth.service";
import {
  ApiErrorResponseDto,
  ApiResponseDto,
} from "@/v3/common/dto/response.dto";

@ApiTags("V3 Auth")
@Controller("auth")
@UseInterceptors(StandardResponseInterceptor)
export class AuthController {
  constructor(
    private readonly exchangeTokenUseCase: ExchangeTokenUseCase,
    private readonly authService: AuthService,
  ) {}

  @AllowPublic()
  @Post("token")
  @ApiOperation({
    summary: "Exchange client credentials for an access token",
    operationId: "Auth_ExchangeToken",
  })
  @ApiResponse({
    status: 201,
    type: TokenResponseDto,
    description: "Token successfully exchanged",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Invalid credentials",
  })
  async exchangeToken(@Body() body: TokenRequestDto) {
    return this.exchangeTokenUseCase.execute(body.clientId, body.clientSecret);
  }

  @AllowPublic()
  @Get("oauth2/*")
  @Post("oauth2/*")
  @Put("oauth2/*")
  @Delete("oauth2/*")
  @Patch("oauth2/*")
  @Head("oauth2/*")
  @Options("oauth2/*")
  @ApiParam({ name: "path", type: "string" })
  @ApiOperation({
    summary: "Handle OAuth2 provider requests",
    description:
      "Proxies OAuth2 requests (authorize, token, userinfo, etc.) to the auth provider",
  })
  async handleOAuth2(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.hostname;
    // Map /v3/auth/oauth2/* to /auth/oauth2/* as expected by better-auth
    const path = req.raw.url.replace("/v3/auth/oauth2", "/auth/oauth2");
    const url = `${protocol}://${host}${path}`;

    const headers = new Headers(req.headers as HeadersInit);

    let body: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = headers.get("content-type");
      if (contentType?.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
          params.append(key, value as string);
        }
        body = params.toString();
      } else if (contentType?.includes("application/json")) {
        body = JSON.stringify(req.body);
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
        return res.send(await response.json());
      }
      return res.send(await response.text());
    }

    return res.send();
  }
}
