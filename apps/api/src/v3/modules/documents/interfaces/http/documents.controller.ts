import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  StreamableFile,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { AllowPublic } from "@/v3/common/auth";
import {
  DocumentsUseCase,
  PrimaryDocumentType,
} from "../../application/documents.use-case";
import { verifyDocumentToken } from "@repo/shared/api/v3";
import * as Fastify from "fastify";

@ApiTags("V3 Documents")
@ApiBearerAuth()
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsUseCase: DocumentsUseCase) {}

  @Get(":type/:id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({
    summary:
      "Generate or stream an organization transaction document (invoice, receipt, waybill, delivery-note, packing-list)",
  })
  @Permissions("transaction:view")
  async getDocument(
    @Req() req: any,
    @Param("type") type: PrimaryDocumentType,
    @Param("id") id: string,
    @Query("template") template: string,
    @Query("format") format: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    const result = await this.documentsUseCase.getDocumentStream(
      type,
      id,
      req.organization.id,
      { template, format },
    );

    res.header("Content-Type", result.contentType);
    res.header(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    return new StreamableFile(result.stream);
  }

  @Get("preview/:type/:id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({
    summary: "Inline preview of document PDF for viewing in browser or modals",
  })
  @Permissions("transaction:view")
  async previewDocument(
    @Req() req: any,
    @Param("type") type: PrimaryDocumentType,
    @Param("id") id: string,
    @Query("template") template: string,
    @Query("format") format: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    const result = await this.documentsUseCase.getDocumentStream(
      type,
      id,
      req.organization.id,
      { template, format, skipCache: true },
    );

    res.header("Content-Type", result.contentType);
    res.header("Content-Disposition", `inline; filename="${result.filename}"`);
    return new StreamableFile(result.stream);
  }

  @Get("config/:type")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Get organization document configuration" })
  @Permissions("organization:view")
  async getConfig(
    @Req() req: any,
    @Param("type") type: "invoice" | "receipt" | "waybill" | "delivery-note",
  ) {
    return this.documentsUseCase.getDocumentConfig(type, req.organization.id);
  }

  @Put("config/:type")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Update organization document configuration" })
  @Permissions("organization:manage")
  async updateConfig(
    @Req() req: any,
    @Param("type") type: "invoice" | "receipt" | "waybill" | "delivery-note",
    @Body() body: any,
  ) {
    return this.documentsUseCase.updateDocumentConfig(
      type,
      req.organization.id,
      body,
    );
  }
}

@ApiTags("V3 Public Documents")
@Controller("public-documents")
@AllowPublic()
export class PublicDocumentsController {
  constructor(private readonly documentsUseCase: DocumentsUseCase) {}

  @Get(":type/:id")
  @ApiOperation({ summary: "Public authenticated download or stream for documents" })
  async getPublicDocument(
    @Param("type") type: PrimaryDocumentType,
    @Param("id") id: string,
    @Query("token") token: string,
    @Query("template") template: string,
    @Query("format") format: string,
    @Query("inline") inline: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    if (!token) throw new UnauthorizedException("Token required");

    // Support both v3 and v2 token verification seamlessly
    let payload = verifyDocumentToken(token);
    if (!payload) {
      try {
        const { verifyDocumentToken: verifyV2Token } = await import(
          "@repo/shared/api/v2"
        );
        payload = verifyV2Token(token);
      } catch (err) {
        // ignore
      }
    }

    if (!payload || payload.type !== type || payload.id !== id) {
      throw new ForbiddenException("Invalid or expired document link");
    }

    const result = await this.documentsUseCase.getDocumentStream(
      type,
      id,
      payload.orgId,
      { template, format },
    );

    const disposition = inline === "true" || inline === "1" ? "inline" : "attachment";
    res.header("Content-Type", result.contentType);
    res.header(
      "Content-Disposition",
      `${disposition}; filename="${result.filename}"`,
    );
    return new StreamableFile(result.stream);
  }
}
