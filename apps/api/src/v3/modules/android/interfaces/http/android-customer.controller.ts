import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { StandardResponseInterceptor } from "../../../../common/interceptors/standard-response.interceptor";
import { AndroidCustomerUseCase } from "../../application/use-cases/android-customer.use-case";
import { AndroidUpdateCustomerDto } from "../../application/dto/android-auth.dto";

@ApiTags("V3 Android Customer")
@Controller("android/customers")
@UseGuards(V3AuthGuard)
@UseInterceptors(StandardResponseInterceptor)
@ApiBearerAuth()
@ApiHeader({ name: "x-org-slug", required: false })
export class AndroidCustomerController {
  constructor(private readonly androidCustomerUseCase: AndroidCustomerUseCase) {}

  @Get()
  @ApiOperation({ summary: "Get organization customers for Android with optional search" })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Customers list retrieved" })
  async getCustomers(
    @Req() req: any,
    @Query("search") search?: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.androidCustomerUseCase.getCustomers(
      req.v3Context,
      search,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer details by ID for Android" })
  @ApiResponse({ status: 200, description: "Customer details retrieved" })
  async getCustomerDetails(@Req() req: any, @Param("id") id: string) {
    return this.androidCustomerUseCase.getCustomerDetails(req.v3Context, id);
  }

  @Get(":id/transactions")
  @ApiOperation({ summary: "Get customer sales transactions for Android" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Customer transactions retrieved" })
  async getCustomerTransactions(
    @Req() req: any,
    @Param("id") id: string,
    @Query("limit") limit?: number
  ) {
    return this.androidCustomerUseCase.getCustomerTransactions(
      req.v3Context,
      id,
      limit ? Number(limit) : 20
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update customer details for Android" })
  @ApiResponse({ status: 200, description: "Customer updated successfully" })
  async updateCustomer(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AndroidUpdateCustomerDto
  ) {
    return this.androidCustomerUseCase.updateCustomer(req.v3Context, id, dto);
  }
}
