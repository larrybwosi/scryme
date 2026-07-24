import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  UsePipes,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { BusinessAccountService } from "@/v3/modules/customers/application/use-cases/business-account.service";
import { CreateBusinessAccountDto } from "../../application/dto/business-account.dto";
import { V3ZodValidationPipe } from "../../../../common/pipes/v3-zod-validation.pipe";
import { CreateBusinessAccountSchema } from "../../application/dto/customer.schema";

@ApiTags("V3 Business Accounts")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@Controller(":orgSlug/business-accounts")
@ApiParam({ name: "orgSlug", type: "string" })
export class BusinessAccountController {
  constructor(
    private readonly businessAccountService: BusinessAccountService,
  ) {}

  @Post()
  @UsePipes(new V3ZodValidationPipe(CreateBusinessAccountSchema))
  @ApiOperation({ summary: "Create a new B2B business account" })
  async create(@Request() req: any, @Body() body: CreateBusinessAccountDto) {
    return this.businessAccountService.createBusinessAccount(
      req.organization.id,
      body,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a business account with CRM timeline" })
  async getOne(@Request() req: any, @Param("id") id: string) {
    return this.businessAccountService.getBusinessAccount(
      req.organization.id,
      id,
    );
  }
}
