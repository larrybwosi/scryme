import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthGuard } from "../../../../common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../../../../common/guards/multi-tenancy.guard";
import { ExpenseUseCase } from "../../application/use-cases/expense.use-case";
import { CreateExpenseDto } from "../../application/dto/finance.dto";
import { PermissionsGuard } from "../../../../common/guards/permissions.guard";
import { Permissions } from "../../../../common/decorators/permissions.decorator";
import { ExpenseStatus } from "@repo/db";

@ApiTags("V3 Finance")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@Controller("finance/expenses")
export class ExpenseController {
  constructor(private readonly expenseUseCase: ExpenseUseCase) {}

  @Post()
  @Permissions("finance:write")
  @ApiOperation({ summary: "Record a new expense" })
  async createExpense(@Req() req: any, @Body() dto: CreateExpenseDto) {
    return this.expenseUseCase.createExpense(req.organization.id, req.user.memberId, dto);
  }

  @Get()
  @Permissions("finance:read")
  @ApiOperation({ summary: "List all expenses" })
  async getExpenses(
    @Req() req: any,
    @Query("status") status?: ExpenseStatus,
    @Query("categoryId") categoryId?: string,
  ) {
    return this.expenseUseCase.getExpenses(req.organization.id, {
      status,
      categoryId,
    });
  }

  @Get(":id")
  @Permissions("finance:read")
  @ApiOperation({ summary: "Get expense details" })
  async getExpense(@Req() req: any, @Param("id") id: string) {
    return this.expenseUseCase.getExpense(req.organization.id, id);
  }
}
