import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Get,
  Req,
  Res,
  All,
  UsePipes,
  Put,
  Delete,
  Patch,
  Head,
  Options,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import { ExchangeTokenUseCase } from "../../application/use-cases/exchange-token.use-case";
import { OAuthClientManagementUseCase } from "../../application/use-cases/oauth-client-management.use-case";
import { ApiKeyManagementUseCase } from "../../application/use-cases/api-key-management.use-case";
import {
  TokenRequestDto,
  TokenResponseDto,
} from "../../application/dto/token.dto";
import {
  CreateOAuthClientDto,
  UpdateOAuthClientDto,
  OAuthClientResponseDto,
} from "../../application/dto/oauth-client.dto";
import {
  CreateOAuthClientSchema,
  UpdateOAuthClientSchema,
} from "../../application/dto/oauth-client.schema";
import { V3ZodValidationPipe } from "../../../../common/pipes/v3-zod-validation.pipe";
import { TokenRequestSchema } from "../../application/dto/token.schema";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { AuthService } from "@/auth/auth.service";
import { CurrentUser } from "@/v3/common/decorators/current-user.decorator";
import {
  ApiErrorResponseDto,
  ApiResponseDto,
  ApiStandardResponse,
} from "@/v3/common/dto/response.dto";

@ApiTags("V3 Auth")
@Controller("auth")
@UseInterceptors(StandardResponseInterceptor)
export class AuthController {
  constructor(
    private readonly exchangeTokenUseCase: ExchangeTokenUseCase,
    private readonly oauthClientManagementUseCase: OAuthClientManagementUseCase,
    private readonly apiKeyManagementUseCase: ApiKeyManagementUseCase,
    private readonly authService: AuthService,
  ) {}

  @AllowPublic()
  @Post("token")
  @UsePipes(new V3ZodValidationPipe(TokenRequestSchema))
  @ApiOperation({
    summary: "Exchange client credentials for an access token",
    operationId: "Auth_ExchangeToken",
  })
  @ApiStandardResponse({
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

  // --- API KEY MANAGEMENT ENDPOINTS ---

  @Post("api-keys")
  @ApiOperation({
    summary: "Create a new V3 API Secret Key for developer account",
    operationId: "Auth_CreateApiKey",
  })
  async createApiKey(
    @CurrentUser() user: any,
    @Body() body: { name: string; environment?: "LIVE" | "TEST" },
  ) {
    return this.apiKeyManagementUseCase.createApiKey(user?.userId || user?.id, body);
  }

  @Get("api-keys")
  @ApiOperation({
    summary: "List V3 API Secret Keys owned by developer",
    operationId: "Auth_ListApiKeys",
  })
  async listApiKeys(@CurrentUser() user: any) {
    return this.apiKeyManagementUseCase.listApiKeys(user?.userId || user?.id);
  }

  @Put("api-keys/:id/toggle")
  @ApiParam({ name: "id", type: "string" })
  @ApiOperation({
    summary: "Toggle enabled status of a V3 API Secret Key",
    operationId: "Auth_ToggleApiKey",
  })
  async toggleApiKey(@CurrentUser() user: any, @Req() req: any) {
    const id = req.params.id;
    return this.apiKeyManagementUseCase.toggleApiKey(id, user?.userId || user?.id);
  }

  @Delete("api-keys/:id")
  @ApiParam({ name: "id", type: "string" })
  @ApiOperation({
    summary: "Revoke and delete a V3 API Secret Key",
    operationId: "Auth_DeleteApiKey",
  })
  async deleteApiKey(@CurrentUser() user: any, @Req() req: any) {
    const id = req.params.id;
    return this.apiKeyManagementUseCase.deleteApiKey(id, user?.userId || user?.id);
  }

  // --- OAUTH CLIENT MANAGEMENT ENDPOINTS ---

  @Post("oauth/clients")
  @UsePipes(new V3ZodValidationPipe(CreateOAuthClientSchema))
  @ApiOperation({
    summary: "Register a new OAuth Application Client for Sign in with Scryme",
    operationId: "Auth_CreateOAuthClient",
  })
  @ApiStandardResponse({
    status: 201,
    type: OAuthClientResponseDto,
    description: "OAuth Client application registered successfully",
  })
  async createOAuthClient(
    @CurrentUser() user: any,
    @Body() body: CreateOAuthClientDto,
  ) {
    return this.oauthClientManagementUseCase.createClient(user?.userId || user?.id, body as any);
  }

  @Get("oauth/clients")
  @ApiOperation({
    summary: "List registered OAuth Application Clients",
    operationId: "Auth_ListOAuthClients",
  })
  async listOAuthClients(@CurrentUser() user: any) {
    return this.oauthClientManagementUseCase.listClients(user?.userId || user?.id);
  }

  @Get("oauth/clients/:id")
  @ApiParam({ name: "id", type: "string" })
  @ApiOperation({
    summary: "Get OAuth Application Client details",
    operationId: "Auth_GetOAuthClient",
  })
  async getOAuthClient(@CurrentUser() user: any, @Req() req: any) {
    const id = req.params.id;
    return this.oauthClientManagementUseCase.getClientById(id, user?.userId || user?.id);
  }

  @Put("oauth/clients/:id")
  @ApiParam({ name: "id", type: "string" })
  @UsePipes(new V3ZodValidationPipe(UpdateOAuthClientSchema))
  @ApiOperation({
    summary: "Update OAuth Application Client configuration",
    operationId: "Auth_UpdateOAuthClient",
  })
  async updateOAuthClient(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body() body: UpdateOAuthClientDto,
  ) {
    const id = req.params.id;
    return this.oauthClientManagementUseCase.updateClient(id, user?.userId || user?.id, body as any);
  }

  @Delete("oauth/clients/:id")
  @ApiParam({ name: "id", type: "string" })
  @ApiOperation({
    summary: "Delete an OAuth Application Client",
    operationId: "Auth_DeleteOAuthClient",
  })
  async deleteOAuthClient(@CurrentUser() user: any, @Req() req: any) {
    const id = req.params.id;
    return this.oauthClientManagementUseCase.deleteClient(id, user?.userId || user?.id);
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
    const host = req.headers.host || req.hostname;
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
