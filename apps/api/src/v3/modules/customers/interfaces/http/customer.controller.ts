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
import { RegisterCustomerSchema, UpdateCustomerSchema, AddressSchema } from "../../application/dto/customer.schema";
import { GetCustomersUseCase } from "../../application/use-cases/get-customers.use-case";
import { RegisterCustomerUseCase } from "../../application/use-cases/register-customer.use-case";
import { UpdateCustomerUseCase } from "../../application/use-cases/update-customer.use-case";
import { GetCustomerByIdUseCase } from "../../application/use-cases/get-customer-by-id.use-case";
import { DeleteCustomerUseCase } from "../../application/use-cases/delete-customer.use-case";
import { ManageAddressesUseCase } from "../../application/use-cases/manage-addresses.use-case";
import { RegisterCustomerDto, AddressDto } from "../../application/dto/register-customer.dto";
import { UpdateCustomerDto } from "../../application/dto/update-customer.dto";
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
    summary: "Register a new customer (Zitadel)",
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
    return this.registerCustomerUseCase.execute(req.organization.id, dto);
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
  async getCustomerById(
    @Req() req: any,
    @Param("id") id: string,
  ) {
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
  async deleteCustomer(
    @Req() req: any,
    @Param("id") id: string,
  ) {
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
  async getAddresses(
    @Req() req: any,
    @Param("id") id: string,
  ) {
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
