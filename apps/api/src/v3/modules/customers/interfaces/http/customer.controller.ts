import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
  Param,
  Patch,
  UsePipes,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { V3ZodValidationPipe } from "../../../../common/pipes/v3-zod-validation.pipe";
import {
  RegisterCustomerSchema,
  UpdateCustomerSchema,
  AddressSchema,
  CustomerLoginSchema,
} from "../../application/dto/customer.schema";
import { GetCustomersUseCase } from "../../application/use-cases/get-customers.use-case";
import { RegisterCustomerUseCase } from "../../application/use-cases/register-customer.use-case";
import { UpdateCustomerUseCase } from "../../application/use-cases/update-customer.use-case";
import { GetCustomerByIdUseCase } from "../../application/use-cases/get-customer-by-id.use-case";
import { DeleteCustomerUseCase } from "../../application/use-cases/delete-customer.use-case";
import { ManageAddressesUseCase } from "../../application/use-cases/manage-addresses.use-case";
import {
  RegisterCustomerDto,
  AddressDto,
  CustomerLoginDto,
} from "../../application/dto/register-customer.dto";
import { UpdateCustomerDto } from "../../application/dto/update-customer.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import { CustomerResponseDto } from "../../application/dto/customer.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";
import { RedisService } from "@/redis/redis.service";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { env } from "@repo/env";
import { randomUUID } from "crypto";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";

@ApiTags("V3 Customers")
@ApiBearerAuth()
@Controller(":orgSlug/customers")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class CustomerController {
  constructor(
    private readonly getCustomersUseCase: GetCustomersUseCase,
    private readonly registerCustomerUseCase: RegisterCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    private readonly manageAddressesUseCase: ManageAddressesUseCase,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @Permissions("customer:read")
  @ApiOperation({
    summary: "Get all customers for an organization",
    operationId: "Customers_GetCustomers",
  })
  @ApiResponse({
    status: 200,
    type: [CustomerResponseDto],
    description: "List of customers",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async getCustomers(
    @Req() req: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.getCustomersUseCase.execute(
      req.organization.id,
      paginationQuery,
    );
  }

  @Post("register")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(RegisterCustomerSchema))
  @ApiOperation({
    summary: "Register a new customer",
    operationId: "Customers_Register",
  })
  @ApiResponse({
    status: 201,
    type: CustomerResponseDto,
    description: "Customer registered successfully",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async register(@Req() req: any, @Body() dto: RegisterCustomerDto) {
    const contextInfo = req.v3Context
      ? {
          authType: req.v3Context.authType,
          clientId: req.v3Context.clientId,
        }
      : undefined;
    return this.registerCustomerUseCase.execute(
      req.organization.id,
      dto,
      contextInfo,
    );
  }

  @Post("auth/login")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(CustomerLoginSchema))
  @ApiOperation({
    summary:
      "Authenticate a customer using email & password, issuing a standard HS256 JWT and session",
    operationId: "Customers_Login",
  })
  @ApiResponse({
    status: 200,
    description: "Customer successfully logged in",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Invalid credentials",
  })
  async login(@Req() req: any, @Body() dto: CustomerLoginDto) {

    const orgId = req.organization.id;

    // Retrieve the customer from DB
    const customer = await this.prisma.client.customer.findUnique({
      where: {
        organizationId_email: {
          organizationId: orgId,
          email: dto.email,
        },
      },
    });

    // Attempt to verify credentials against linked user
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    // Mitigate timing attacks and username/email enumeration side-channels:
    // Always perform a cryptographically heavy bcrypt.compare with a valid dummy hash
    // when the customer or the linked user is not found.
    const dummyHash =
      "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO";
    const hashToCompare = user?.password || dummyHash;
    const isPasswordValid = await bcrypt.compare(
      dto.password || "",
      hashToCompare,
    );

    if (!customer || !user || !isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Create a secure active customer session in Redis
    const sessionId = `sess_${randomUUID()}`;
    const tokenPayload = {
      sub: customer.id,
      sessionId,
      customerEmail: customer.email,
      customerName: customer.name,
      organizationId: orgId,
      orgSlug: req.organization.slug,
      type: "v3_customer",
    };

    const token = jwt.sign(
      tokenPayload,
      env.JWT_SECRET || "default_jwt_secret",
      {
        expiresIn: "7d",
        algorithm: "HS256",
      },
    );

    const sessionState = {
      id: sessionId,
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      token,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Store the session in Redis with 7 days TTL
    await this.redis.setex(
      `customer_session:${customer.id}:${sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(sessionState),
    );

    return {
      success: true,
      token,
      session: sessionState,
    };
  }

  @Post("auth/refresh")
  @AllowPublic()
  @ApiOperation({
    summary: "Refresh an active or expired customer session token, issuing a fresh HS256 customer JWT",
    operationId: "Customers_RefreshSession",
  })
  @ApiResponse({
    status: 200,
    description: "Session successfully refreshed",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Invalid or expired session",
  })
  async refresh(@Req() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }
    const oldToken = authHeader.split(" ")[1];

    let payload: any;
    try {
      payload = jwt.verify(oldToken, env.JWT_SECRET || "default_jwt_secret", {
        ignoreExpiration: true,
        algorithms: ["HS256"],
      }) as any;
    } catch (e) {
      throw new UnauthorizedException("Invalid token");
    }

    if (!payload || payload.type !== "v3_customer" || !payload.sessionId) {
      throw new UnauthorizedException("Invalid token type");
    }

    // Check if session is still active in Redis
    const sessionKey = `customer_session:${payload.sub}:${payload.sessionId}`;
    const sessionData = await this.redis.get<string>(sessionKey);
    if (!sessionData) {
      throw new UnauthorizedException("Session has been revoked or expired");
    }

    const parsedSession = JSON.parse(sessionData);

    // Issue a fresh local HS256 customer JWT
    const newPayload = {
      sub: payload.sub,
      sessionId: payload.sessionId,
      customerEmail: payload.customerEmail,
      customerName: payload.customerName,
      organizationId: payload.organizationId,
      orgSlug: payload.orgSlug,
      type: "v3_customer",
    };

    const token = jwt.sign(
      newPayload,
      env.JWT_SECRET || "default_jwt_secret",
      {
        expiresIn: "7d",
        algorithm: "HS256",
      },
    );

    // Update session token and expiresAt in Redis
    const updatedSession = {
      ...parsedSession,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await this.redis.setex(
      sessionKey,
      7 * 24 * 60 * 60,
      JSON.stringify(updatedSession),
    );

    return {
      success: true,
      token,
      session: updatedSession,
    };
  }

  @Get("auth/session")
  @ApiOperation({
    summary: "Retrieve the current active customer session and profile details",
    operationId: "Customers_GetCurrentSession",
  })
  @ApiResponse({
    status: 200,
    description: "Current customer session and profile details",
  })
  async getCurrentSession(@Req() req: any) {
    const customerId = req.v3Context?.customerId || req.user?.id;
    if (!customerId) {
      throw new UnauthorizedException("Customer context required");
    }

    // Retrieve safe customer details from DB
    const customer = await this.prisma.client.customer.findFirst({
      where: {
        id: customerId,
        organizationId: req.organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        customerType: true,
        dateOfBirth: true,
        loyaltyPoints: true,
        taxId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      throw new UnauthorizedException("Customer profile not found");
    }

    let session = null;
    const sessionId = req.v3Context?.sessionId;
    if (sessionId) {
      const sessionKey = `customer_session:${customerId}:${sessionId}`;
      const sessionData = await this.redis.get<string>(sessionKey);
      if (sessionData) {
        try {
          const parsedSession = JSON.parse(sessionData);
          // Omit token for security in client response!
          const { token, ...safeSession } = parsedSession;
          session = safeSession;
        } catch (e) {
          // Ignored
        }
      }
    }

    return {
      session,
      customer,
    };
  }

  @Get("auth/sessions")
  @ApiOperation({
    summary: "Retrieve all active customer sessions",
    operationId: "Customers_GetSessions",
  })
  @ApiResponse({
    status: 200,
    description: "Active customer sessions list",
  })
  async getSessions(@Req() req: any) {
    const customerId = req.v3Context?.customerId || req.user?.id;
    if (!customerId) {
      throw new UnauthorizedException("Customer context required");
    }

    const keys = await this.redis.keys(`customer_session:${customerId}:*`);

    // OPTIMIZATION (Bolt ⚡): Parallelize Redis key retrievals using Promise.all to avoid O(N) sequential blocking roundtrips
    const sessionData = await Promise.all(
      keys.map(key => this.redis.get<string>(key)),
    );

    const sessions = [];
    for (const data of sessionData) {
      if (data) {
        try {
          const parsedSession = JSON.parse(data);
          const { token, ...safeSession } = parsedSession;
          sessions.push(safeSession);
        } catch (e) {
          // Ignored
        }
      }
    }

    return sessions;
  }

  @Delete("auth/sessions/:id")
  @ApiOperation({
    summary: "Revoke a specific active customer session",
    operationId: "Customers_RevokeSession",
  })
  @ApiResponse({
    status: 200,
    description: "Session successfully revoked",
  })
  async revokeSession(@Req() req: any, @Param("id") sessionId: string) {
    const customerId = req.v3Context?.customerId || req.user?.id;
    if (!customerId) {
      throw new UnauthorizedException("Customer context required");
    }

    await this.redis.del(`customer_session:${customerId}:${sessionId}`);

    return {
      success: true,
      message: `Session ${sessionId} successfully revoked`,
    };
  }

  @Delete("auth/sessions")
  @ApiOperation({
    summary: "Revoke all or other active customer sessions",
    operationId: "Customers_RevokeAllSessions",
  })
  @ApiResponse({
    status: 200,
    description: "Sessions successfully revoked",
  })
  async revokeAllSessions(@Req() req: any, @Query("mode") mode?: string) {
    const customerId = req.v3Context?.customerId || req.user?.id;
    const currentSessionId = req.v3Context?.sessionId;
    if (!customerId) {
      throw new UnauthorizedException("Customer context required");
    }

    const keys = await this.redis.keys(`customer_session:${customerId}:*`);

    const keysToDelete = keys.filter(
      key =>
        !(
          mode === "other" &&
          currentSessionId &&
          key.endsWith(`:${currentSessionId}`)
        ),
    );

    if (keysToDelete.length > 0) {
      // OPTIMIZATION (Bolt ⚡): Batch delete all matching keys in a single Redis command to avoid sequential network roundtrips
      await this.redis.del(...keysToDelete);
    }

    return {
      success: true,
      message:
        mode === "other"
          ? "Other sessions successfully revoked"
          : "All sessions successfully revoked",
    };
  }

  @Patch(":id")
  @Permissions("customer:update")
  @UsePipes(new V3ZodValidationPipe(UpdateCustomerSchema))
  @ApiOperation({
    summary: "Update a customer profile",
    operationId: "Customers_Update",
  })
  @ApiResponse({
    status: 200,
    type: CustomerResponseDto,
    description: "Customer updated successfully",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Customer not found",
  })
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.updateCustomerUseCase.execute(req.organization.id, id, dto);
  }

  @Get(":id")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "Get a customer profile by ID",
    operationId: "Customers_GetCustomerById",
  })
  @ApiResponse({
    status: 200,
    type: CustomerResponseDto,
    description: "Customer found successfully",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Customer not found",
  })
  async getCustomerById(@Req() req: any, @Param("id") id: string) {
    return this.getCustomerByIdUseCase.execute(req.organization.id, id);
  }

  @Delete(":id")
  @Permissions("customer:delete")
  @ApiOperation({
    summary: "Delete/Deactivate a customer",
    operationId: "Customers_Delete",
  })
  @ApiResponse({
    status: 200,
    description: "Customer deleted/deactivated successfully",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Customer not found",
  })
  async deleteCustomer(@Req() req: any, @Param("id") id: string) {
    return this.deleteCustomerUseCase.execute(req.organization.id, id);
  }

  @Get(":id/addresses")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "Get customer addresses",
    operationId: "Customers_GetAddresses",
  })
  @ApiResponse({
    status: 200,
    description: "Addresses retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Customer not found",
  })
  async getAddresses(@Req() req: any, @Param("id") id: string) {
    return this.manageAddressesUseCase.getAddresses(req.organization.id, id);
  }

  @Post(":id/addresses")
  @Permissions("customer:update")
  @UsePipes(new V3ZodValidationPipe(AddressSchema))
  @ApiOperation({
    summary: "Add or update customer address",
    operationId: "Customers_AddAddress",
  })
  @ApiResponse({
    status: 201,
    description: "Address added/updated successfully",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Customer not found",
  })
  async addAddress(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AddressDto,
  ) {
    return this.manageAddressesUseCase.addAddress(req.organization.id, id, dto);
  }
}
