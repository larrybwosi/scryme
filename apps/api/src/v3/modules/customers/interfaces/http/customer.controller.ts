import { CustomerAuthService } from "@/customer-auth/customer-auth.service";
import {
  Logger,
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
  CustomerForgotPasswordSchema,
  CustomerResetPasswordSchema,
  CustomerSendVerificationEmailSchema,
  CustomerVerifyEmailSchema,
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
  CustomerForgotPasswordDto,
  CustomerResetPasswordDto,
  CustomerSendVerificationEmailDto,
  CustomerVerifyEmailDto,
} from "../../application/dto/register-customer.dto";
import { UpdateCustomerDto } from "../../application/dto/update-customer.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { AllowPublic } from "@/v3/common/auth";
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
  private readonly logger = new Logger(CustomerController.name);
  constructor(
    private readonly getCustomersUseCase: GetCustomersUseCase,
    private readonly registerCustomerUseCase: RegisterCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    private readonly manageAddressesUseCase: ManageAddressesUseCase,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly customerAuthService: CustomerAuthService,
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

  @Post("../customer/register")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(RegisterCustomerSchema))
  @ApiOperation({
    summary: "Register a new customer (singular alias)",
    operationId: "Customer_Register",
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
  async registerSingular(@Req() req: any, @Body() dto: RegisterCustomerDto) {
    return this.register(req, dto);
  }

  @Post("auth/login")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(CustomerLoginSchema))
  @ApiOperation({
    summary:
      "Authenticate a customer using email & password via CustomerAuthService (Better Auth)",
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

    // Verify customer exists in this organization
    const customer = await this.prisma.client.customer.findUnique({
      where: {
        organizationId_email: {
          organizationId: orgId,
          email: dto.email,
        },
      },
    });

    if (!customer) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Authenticate through CustomerAuthService (Better Auth)
    let authResult: any = null;
    try {
      const headers = new Headers();
      if (req.headers["user-agent"]) {
        headers.set("user-agent", req.headers["user-agent"]);
      }
      if (req.ip) {
        headers.set("x-forwarded-for", req.ip);
      }

      authResult = await this.customerAuthService.auth.api.signInEmail({
        body: {
          email: dto.email,
          password: dto.password,
        },
        headers,
      });
    } catch (err: any) {
      throw new UnauthorizedException(err?.message || "Invalid credentials");
    }

    if (!authResult || !authResult.session) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = authResult.token || authResult.session?.token;

    // Link customer to Better Auth user via externalMapping if not yet mapped
    if (authResult.user?.id) {
      await this.prisma.client.externalMapping.upsert({
        where: {
          organizationId_provider_externalId_entityType: {
            organizationId: orgId,
            provider: "BETTER_AUTH",
            externalId: authResult.user.id,
            entityType: "CUSTOMER",
          },
        },
        create: {
          organizationId: orgId,
          internalId: customer.id,
          externalId: authResult.user.id,
          provider: "BETTER_AUTH",
          entityType: "CUSTOMER",
          internalEntityType: "Customer",
        },
        update: {
          internalId: customer.id,
        },
      });
    }

    const sessionState = {
      id: authResult.session.id,
      customerId: customer.id,
      userId: authResult.user?.id,
      email: customer.email,
      name: customer.name,
      token,
      userAgent: authResult.session.userAgent || req.headers["user-agent"] || null,
      ipAddress: authResult.session.ipAddress || req.ip || null,
      createdAt: authResult.session.createdAt,
      expiresAt: authResult.session.expiresAt,
    };

    return {
      success: true,
      token,
      session: sessionState,
      user: customer,
    };
  }

  @Post("auth/refresh")
  @AllowPublic()
  @ApiOperation({
    summary: "Refresh active customer session using CustomerAuthService",
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
    const token = authHeader.split(" ")[1];

    const headers = new Headers();
    headers.set("authorization", `Bearer ${token}`);

    const session = await this.customerAuthService.auth.api.getSession({
      headers,
    });

    if (!session || !session.session) {
      throw new UnauthorizedException("Session has been revoked or expired");
    }

    const targetOrgId = req.organization?.id;
    let customer = null;

    if (targetOrgId) {
      const mapping = await this.prisma.client.externalMapping.findFirst({
        where: {
          organizationId: targetOrgId,
          provider: "BETTER_AUTH",
          externalId: session.user.id,
          entityType: "CUSTOMER",
        },
      });
      if (mapping?.internalId) {
        customer = await this.prisma.client.customer.findUnique({
          where: { id: mapping.internalId },
        });
      }
      if (!customer && session.user.email) {
        customer = await this.prisma.client.customer.findUnique({
          where: {
            organizationId_email: {
              organizationId: targetOrgId,
              email: session.user.email,
            },
          },
        });
      }
    }

    const sessionState = {
      id: session.session.id,
      customerId: customer?.id || session.session.userId,
      userId: session.user.id,
      email: customer?.email || session.user.email,
      name: customer?.name || session.user.name,
      token: session.session.token || token,
      userAgent: session.session.userAgent || null,
      ipAddress: session.session.ipAddress || null,
      createdAt: session.session.createdAt,
      expiresAt: session.session.expiresAt,
    };

    return {
      success: true,
      token: session.session.token || token,
      session: sessionState,
      user: customer || session.user,
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

    const authHeader = req.headers.authorization;
    let session = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const headers = new Headers();
      headers.set("authorization", `Bearer ${token}`);
      try {
        const authData = await this.customerAuthService.auth.api.getSession({
          headers,
        });
        if (authData?.session) {
          const { token: _t, ...safeSession } = authData.session;
          session = safeSession;
        }
      } catch (e) {
        // Ignored
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Customer authentication required");
    }
    const token = authHeader.split(" ")[1];
    const headers = new Headers();
    headers.set("authorization", `Bearer ${token}`);

    try {
      const sessions = await this.customerAuthService.auth.api.listSessions({
        headers,
      });
      return Array.isArray(sessions) ? sessions : [];
    } catch (e: any) {
      return [];
    }
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
  async revokeSession(@Req() req: any, @Param("id") sessionIdOrToken: string) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Customer authentication required");
    }
    const token = authHeader.split(" ")[1];
    const headers = new Headers();
    headers.set("authorization", `Bearer ${token}`);

    try {
      await this.customerAuthService.auth.api.revokeSession({
        body: { token: sessionIdOrToken },
        headers,
      });
    } catch (e: any) {
      this.logger.warn(`Revoke session notice: ${e?.message || e}`);
    }

    return {
      success: true,
      message: `Session ${sessionIdOrToken} successfully revoked`,
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Customer authentication required");
    }
    const token = authHeader.split(" ")[1];
    const headers = new Headers();
    headers.set("authorization", `Bearer ${token}`);

    try {
      if (mode === "other") {
        await this.customerAuthService.auth.api.revokeOtherSessions({
          headers,
        });
      } else {
        await this.customerAuthService.auth.api.revokeSessions({
          headers,
        });
      }
    } catch (e: any) {
      this.logger.warn(`Revoke sessions notice: ${e?.message || e}`);
    }

    return {
      success: true,
      message:
        mode === "other"
          ? "Other sessions successfully revoked"
          : "All sessions successfully revoked",
    };
  }

  @Post("auth/forgot-password")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(CustomerForgotPasswordSchema))
  @ApiOperation({
    summary: "Initiate customer password reset via email",
    operationId: "Customers_ForgotPassword",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset instructions dispatched if email exists",
  })
  async forgotPassword(@Req() req: any, @Body() dto: CustomerForgotPasswordDto) {
    try {
      await this.customerAuthService.auth.api.requestPasswordReset({
        body: {
          email: dto.email,
          redirectTo: dto.redirectTo,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Forgot password notice: ${e?.message || e}`);
    }

    return {
      success: true,
      message: "If an account exists with this email, password reset instructions have been dispatched.",
    };
  }

  @Post("auth/reset-password")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(CustomerResetPasswordSchema))
  @ApiOperation({
    summary: "Complete customer password reset using token",
    operationId: "Customers_ResetPassword",
  })
  @ApiResponse({
    status: 200,
    description: "Password successfully reset",
  })
  async resetPassword(@Req() req: any, @Body() dto: CustomerResetPasswordDto) {
    try {
      await this.customerAuthService.auth.api.resetPassword({
        body: {
          token: dto.token,
          newPassword: dto.newPassword,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(e?.message || "Invalid or expired password reset token");
    }

    return {
      success: true,
      message: "Password successfully reset. You may now log in with your new credentials.",
    };
  }

  @Post("auth/send-verification-email")
  @AllowPublic()
  @UsePipes(new V3ZodValidationPipe(CustomerSendVerificationEmailSchema))
  @ApiOperation({
    summary: "Send email verification link to customer",
    operationId: "Customers_SendVerificationEmail",
  })
  @ApiResponse({
    status: 200,
    description: "Verification email dispatched if account exists",
  })
  async sendVerificationEmail(@Req() req: any, @Body() dto: CustomerSendVerificationEmailDto) {
    try {
      await this.customerAuthService.auth.api.sendVerificationEmail({
        body: {
          email: dto.email,
          callbackURL: dto.callbackURL,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Send verification email notice: ${e?.message || e}`);
    }

    return {
      success: true,
      message: "Verification email dispatched successfully.",
    };
  }

  @Get("auth/verify-email")
  @AllowPublic()
  @ApiOperation({
    summary: "Verify customer email with verification token",
    operationId: "Customers_VerifyEmail",
  })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully",
  })
  async verifyEmail(@Req() req: any, @Query() query: CustomerVerifyEmailDto) {
    try {
      await this.customerAuthService.auth.api.verifyEmail({
        query: {
          token: query.token,
          callbackURL: query.callbackURL,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(e?.message || "Invalid or expired verification token");
    }

    return {
      success: true,
      message: "Email verified successfully.",
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
