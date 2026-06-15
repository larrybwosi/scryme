import {Controller, Get, Param, Query, Res} from "@nestjs/common";
import {ApiTags, ApiOperation} from "@nestjs/swagger";
import {PublicService} from "./public.service";
import {AllowPublic} from "../../common/decorators/auth.decorator";

@ApiTags("Public")
@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @AllowPublic()
  @Get("documents/:type/:id")
  @ApiOperation({summary: "Access a public document (Invoice, Waybill, etc.)"})
  async getDocument(
    @Param("type") type: string,
    @Param("id") id: string,
    @Query("token") token: string,
    @Query("format") format: string,
    @Query("template") template: string,
    @Res() res: any,
  ) {
    const result = await this.publicService.getDocument(
      type,
      id,
      token,
      format,
      template,
    );

    res.header("Content-Type", result.contentType);
    res.header("Content-Disposition", `inline; filename="${result.filename}"`);
    res.header("Cache-Control", "private, max-age=3600");

    // For Fastify, we can send the stream directly.
    // In NestJS with Fastify, we should use res.send(stream)
    return res.send(result.stream);
  }
}
