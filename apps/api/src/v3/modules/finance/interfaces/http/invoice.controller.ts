import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { verifyDocumentToken } from "@repo/shared/api/v2";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { InvoiceUseCase } from "../../application/use-cases/invoice.use-case";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceConfigDto,
} from "../../application/dto/invoice.dto";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import * as Fastify from "fastify";

@ApiTags("V3 Finance")
@ApiBearerAuth()
@Controller("finance/invoices")
export class InvoiceController {
  constructor(private readonly invoiceUseCase: InvoiceUseCase) {}

  @Post()
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Create a new invoice" })
  @Permissions("invoice:manage")
  async createInvoice(@Req() req, @Body() dto: CreateInvoiceDto) {
    return this.invoiceUseCase.createInvoice(req.organization.id, dto);
  }

  @Get()
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "List all invoices" })
  @Permissions("invoice:view")
  async getInvoices(@Req() req) {
    return this.invoiceUseCase.getInvoices(req.organization.id);
  }

  @Get(":id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Get invoice details" })
  @Permissions("invoice:view")
  async getInvoice(@Req() req, @Param("id") id: string) {
    return this.invoiceUseCase.getInvoiceById(req.organization.id, id);
  }

  @Put(":id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Update an existing invoice" })
  @Permissions("invoice:manage")
  async updateInvoice(
    @Req() req,
    @Param("id") id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoiceUseCase.updateInvoice(req.organization.id, id, dto);
  }

  @Delete(":id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Delete an invoice" })
  @Permissions("invoice:manage")
  async deleteInvoice(@Req() req, @Param("id") id: string) {
    return this.invoiceUseCase.deleteInvoice(req.organization.id, id);
  }

  @Post(":id/finalize")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Finalize and sign an invoice" })
  @Permissions("invoice:manage")
  async finalizeInvoice(@Req() req, @Param("id") id: string) {
    return this.invoiceUseCase.finalizeInvoice(req.organization.id, id);
  }

  // Template Management Endpoints
  @Get("templates")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "List all invoice templates" })
  @Permissions("invoice:view")
  async getTemplates(@Req() req) {
    return this.invoiceUseCase.getTemplates(req.organization.id);
  }

  @Post("templates")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Create a new invoice template" })
  @Permissions("invoice:manage")
  async createTemplate(@Req() req, @Body() data: any) {
    return this.invoiceUseCase.createTemplate(req.organization.id, data);
  }

  @Get("config")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Get invoice configuration" })
  @Permissions("invoice:view")
  async getConfig(@Req() req) {
    return this.invoiceUseCase.getInvoiceConfig(req.organization.id);
  }

  @Put("config")
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiOperation({ summary: "Update invoice configuration" })
  @Permissions("invoice:manage")
  async updateConfig(@Req() req, @Body() dto: InvoiceConfigDto) {
    return this.invoiceUseCase.updateInvoiceConfig(req.organization.id, dto);
  }
}

@ApiTags("Public Invoices")
@Controller("public-invoices")
@AllowPublic()
export class PublicInvoiceController {
  constructor(private readonly invoiceUseCase: InvoiceUseCase) {}

  @Get(":id/download")
  @ApiOperation({ summary: "Download invoice PDF" })
  async downloadInvoice(
    @Param("id") id: string,
    @Query("token") token: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    if (!token) throw new UnauthorizedException("Token required");
    const payload = verifyDocumentToken(token);

    if (!payload || payload.type !== "invoice" || payload.id !== id) {
      throw new ForbiddenException("Invalid or expired link");
    }

    const stream = await this.invoiceUseCase.getDownloadStreamDirect(
      id,
      payload.orgId,
    );
    res.header("Content-Type", "application/pdf");
    res.header("Content-Disposition", `attachment; filename=invoice-${id}.pdf`);
    return new StreamableFile(stream);
  }

  @Get("transactions/:transactionId/download")
  @ApiOperation({ summary: "Download invoice PDF by transaction ID" })
  async downloadInvoiceByTransaction(
    @Param("transactionId") transactionId: string,
    @Query("token") token: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    if (!token) throw new UnauthorizedException("Token required");
    const payload = verifyDocumentToken(token);

    if (
      !payload ||
      payload.type !== "invoice" ||
      payload.id !== transactionId
    ) {
      throw new ForbiddenException("Invalid or expired link");
    }

    const stream = await this.invoiceUseCase.getInvoiceDownloadStreamByTransaction(
      transactionId,
      payload.orgId,
    );
    res.header("Content-Type", "application/pdf");
    res.header(
      "Content-Disposition",
      `attachment; filename=invoice-${transactionId}.pdf`,
    );
    return new StreamableFile(stream);
  }

  @Get("receipts/:transactionId/download")
  @ApiOperation({ summary: "Download receipt PDF" })
  async downloadReceipt(
    @Param("transactionId") transactionId: string,
    @Query("token") token: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    if (!token) throw new UnauthorizedException("Token required");
    const payload = verifyDocumentToken(token);

    if (
      !payload ||
      payload.type !== "receipt" ||
      payload.id !== transactionId
    ) {
      throw new ForbiddenException("Invalid or expired link");
    }

    const stream = await this.invoiceUseCase.getReceiptDownloadStream(
      transactionId,
      payload.orgId,
    );
    res.header("Content-Type", "application/pdf");
    res.header(
      "Content-Disposition",
      `attachment; filename=receipt-${transactionId}.pdf`,
    );
    return new StreamableFile(stream);
  }
}
