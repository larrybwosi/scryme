import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  Query,
  Param,
  Req,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthCoreService } from "../../../auth-core/infrastructure/services/v3-auth-core.service";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { type V3ApiContext, getPosProducts, getPosProductsDelta, type V2ApiContext } from "@repo/shared/api/v2";
import { ProcessSaleDto } from "../../application/dto/sale.dto";
import { ProcessSaleUseCase } from "../../application/use-cases/process-sale.use-case";
import { SyncUseCase } from "../../application/use-cases/sync.use-case";
import { GetTransactionsUseCase } from "../../application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "../../application/use-cases/register-petty-cash.use-case";
import { RegisterPettyCashDto } from "../../application/dto/petty-cash.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import {
  ProvisionDeviceDto,
  PosLoginDto,
  PosLoginResponseDto,
  ProvisionResponseDto,
} from "../../application/dto/pos.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { RequireMember } from "@/v3/common/decorators/require-member.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { PosService } from "@/v2/pos/pos.service";
import { PosCustomerService } from "@/v2/pos/pos-customer.service";
import { AllowPublic } from "@/common/decorators/auth.decorator";

@ApiTags("V3 POS")
@Controller(":orgSlug/pos")
@ApiParam({ name: "orgSlug", type: "string" })
@UseInterceptors(StandardResponseInterceptor)
export class PosController {
  constructor(
    private readonly authCore: V3AuthCoreService,
    private readonly processSaleUseCase: ProcessSaleUseCase,
    private readonly syncUseCase: SyncUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly registerPettyCashUseCase: RegisterPettyCashUseCase,
    private readonly prisma: PrismaService,
    private readonly posService: PosService,
    private readonly posCustomerService: PosCustomerService,
  ) {}

  @Post("provision")
  @ApiOperation({
    summary: "Provision a new POS device using a setup token",
    operationId: "POS_Provision",
  })
  @ApiResponse({
    status: 201,
    type: ProvisionResponseDto,
    description: "Device provisioned",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid token",
  })
  async provision(@Body() body: ProvisionDeviceDto) {
    return this.authCore.provisionDevice(body.token);
  }

  @Post("login")
  @ApiOperation({
    summary: "Login staff member to a provisioned POS device",
    operationId: "POS_Login",
  })
  @ApiResponse({
    status: 200,
    type: PosLoginResponseDto,
    description: "Login successful",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Invalid credentials",
  })
  async login(@Body() body: PosLoginDto, @Req() req: any) {
    const apiKeyHeader = req.headers["x-api-key"] || req.headers["X-API-KEY"];
    let clientId = body.clientId;
    if (!clientId && apiKeyHeader) {
      const apiKeyStr = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
      clientId = apiKeyStr.includes(".") ? apiKeyStr.split(".")[0] : apiKeyStr;
    }
    if (!clientId && body.deviceKey) {
      const devKey = body.deviceKey;
      clientId = devKey.includes(".") ? devKey.split(".")[0] : devKey;
    }
    if (!clientId) {
      throw new BadRequestException("clientId or X-API-KEY header is required");
    }

    return this.authCore.loginMember(
      clientId,
      body.pin || "",
      body.cardId,
    );
  }

  @Get("me")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current POS device and staff context",
    operationId: "POS_GetMe",
  })
  @ApiResponse({ status: 200, description: "Current context" })
  async getMe(@v3Context() ctx: V3ApiContext) {
    return {
      ...ctx,
      isCheckedIn: !!ctx.memberId,
    };
  }

  @Get("locations")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS active inventory locations",
    operationId: "POS_GetLocations",
  })
  @ApiResponse({ status: 200, description: "Active locations" })
  async getLocations(@v3Context() ctx: V3ApiContext) {
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        locationType: true,
        isDefault: true,
      },
      orderBy: { name: "asc" },
    });
    return { locations };
  }

  @Get("products")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS products for full or delta sync",
    operationId: "POS_GetProducts",
  })
  @ApiResponse({ status: 200, description: "POS products list" })
  async getProducts(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    const { lastSync, locationId: queryLocationId, page, limit, search, categoryId } = query;
    const locationId = ctx.locationId || queryLocationId;

    if (!locationId) {
      throw new BadRequestException("Location ID is required.");
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 2000;

    return lastSync
      ? getPosProductsDelta({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          lastSync,
          page: pageNum,
          limit: limitNum,
        })
      : getPosProducts({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          page: pageNum,
          limit: limitNum,
          search,
          categoryId,
        });
  }

  @Get("pricing")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS pricing tables",
    operationId: "POS_GetPricing",
  })
  @ApiResponse({ status: 200, description: "Pricing data" })
  async getPricing(@v3Context() ctx: V3ApiContext, @Query("lastSync") lastSync?: string) {
    return this.posService.getPricing(ctx as unknown as V2ApiContext, lastSync);
  }

  @Get("pricing/sync")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Sync POS pricing tables (delta)",
    operationId: "POS_SyncPricing",
  })
  @ApiResponse({ status: 200, description: "Pricing sync data" })
  async syncPricing(@v3Context() ctx: V3ApiContext, @Query("lastSync") lastSync?: string) {
    return this.posService.getPricing(ctx as unknown as V2ApiContext, lastSync);
  }

  @Get("customers")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS customers delta/full",
    operationId: "POS_GetCustomers",
  })
  @ApiResponse({ status: 200, description: "Customers list" })
  async getCustomers(@v3Context() ctx: V3ApiContext, @Query("lastSync") lastSync?: string) {
    return this.posCustomerService.getCustomersDelta(ctx.organizationId, lastSync);
  }

  @AllowPublic()
  @Post("ably-auth")
  @ApiOperation({
    summary: "Get token for realtime communication",
    operationId: "POS_AblyAuth",
  })
  @ApiResponse({ status: 200, description: "Realtime Auth token" })
  async ablyAuth() {
    return { token: "socket-io-realtime" };
  }

  @Get("sale")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List POS sales / transactions",
    operationId: "POS_GetSales",
  })
  @ApiResponse({ status: 200, description: "Sales transactions list" })
  async getSales(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.getTransactionsUseCase.execute(ctx, query);
  }

  @Get("sale/:id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS sale by ID",
    operationId: "POS_GetSaleById",
  })
  @ApiResponse({ status: 200, description: "Sale transaction details" })
  async getSaleById(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    const sale = await this.prisma.client.transaction.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
        payments: true,
        serviceItems: true,
      },
    });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  @Post("sale")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Process a new POS sale",
    operationId: "POS_ProcessSale",
  })
  @ApiResponse({ status: 201, description: "Sale processed" })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid sale data",
  })
  async processSale(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ProcessSaleDto,
    @Query("locationId") queryLocationId?: string,
  ) {
    const saleCtx = {
      ...ctx,
      locationId: ctx.locationId || queryLocationId || body?.locationId,
    };
    return this.processSaleUseCase.execute(saleCtx, body);
  }

  @Post("sale/payments")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Record payment for a sale",
    operationId: "POS_RecordPayment",
  })
  @ApiResponse({ status: 201, description: "Payment recorded" })
  async recordPayment(
    @v3Context() ctx: V3ApiContext,
    @Body() body: any,
  ) {
    const { transactionId, amount, method, reference, notes } = body;
    if (!transactionId || !amount || !method) {
      throw new BadRequestException("transactionId, amount, and method are required");
    }

    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id: transactionId, organizationId: ctx.organizationId },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    const payment = await this.prisma.client.transactionPayment.create({
      data: {
        transactionId,
        organizationId: ctx.organizationId,
        amount: Number(amount),
        method,
        referenceNumber: reference,
        notes,
        status: "COMPLETED",
      },
    });

    return payment;
  }

  @Get("sync")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Full or delta POS sync",
    operationId: "POS_Sync",
  })
  @ApiResponse({ status: 200, description: "Sync data" })
  async sync(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.syncUseCase.execute(ctx, query);
  }

  @Get("transactions")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List POS transactions",
    operationId: "POS_GetTransactions",
  })
  @ApiResponse({ status: 200, description: "Transactions" })
  async getTransactions(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.getTransactionsUseCase.execute(ctx, query);
  }

  @Post("petty-cash")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Register a new petty cash expense",
    operationId: "POS_RegisterPettyCash",
  })
  @ApiResponse({ status: 201, description: "Petty cash expense registered" })
  async registerPettyCash(
    @v3Context() ctx: V3ApiContext,
    @Body() body: RegisterPettyCashDto,
  ) {
    return this.registerPettyCashUseCase.execute(ctx, body);
  }

  @Get("petty-cash/funds")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List available petty cash funds",
    operationId: "POS_GetPettyCashFunds",
  })
  @ApiResponse({ status: 200, description: "Petty cash funds" })
  async getPettyCashFunds(@v3Context() ctx: V3ApiContext) {
    return this.registerPettyCashUseCase.getFunds(ctx);
  }

  @Get("petty-cash/transactions")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List recent petty cash transactions",
    operationId: "POS_GetPettyCashTransactions",
  })
  @ApiResponse({ status: 200, description: "Petty cash transactions" })
  async getPettyCashTransactions(
    @v3Context() ctx: V3ApiContext,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.registerPettyCashUseCase.getRecentTransactions(ctx, parsedLimit);
  }
}
