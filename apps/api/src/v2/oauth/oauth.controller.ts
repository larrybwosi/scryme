import {Controller, Post, Body, Headers} from "@nestjs/common";
import {ApiTags, ApiOperation} from "@nestjs/swagger";
import {OAuthService} from "./oauth.service";
import {AllowPublic} from "../../common/decorators/auth.decorator";

@ApiTags("OAuth")
@Controller("oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @AllowPublic()
  @Post("token")
  @ApiOperation({summary: "OAuth 2.0 Client Credentials Grant"})
  async token(
    @Body() body: any,
    @Headers("content-type") contentType: string = "",
  ) {
    return this.oauthService.issueToken(body, contentType);
  }
}
