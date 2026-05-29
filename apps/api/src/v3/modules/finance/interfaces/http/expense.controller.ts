import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { V3AuthGuard } from '../../../../common/guards/v3-auth.guard';
import { MultiTenancyGuard } from '../../../../common/guards/multi-tenancy.guard';
import { ExpenseUseCase } from '../../application/use-cases/expense.use-case';
import { CreateExpenseDto } from '../../application/dto/finance.dto';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { ExpenseStatus } from '@repo/db';

@ApiTags('Finance / Expenses')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@Controller('finance/expenses')
export class ExpenseController {
  constructor(private readonly expenseUseCase: ExpenseUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Register a new expense' })
  @Permissions('expense:manage')
  async createExpense(@Req() req, @Body() dto: CreateExpenseDto) {
    return this.expenseUseCase.createExpense(req.organization.id, req.user.memberId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all expenses' })
  @ApiQuery({ name: 'status', required: false, enum: ExpenseStatus })
  @ApiQuery({ name: 'categoryId', required: false })
  @Permissions('expense:view')
  async getExpenses(
    @Req() req,
    @Query('status') status?: ExpenseStatus,
    @Query('categoryId') categoryId?: string,
  ) {
    const filters = {
      ...(status && { status }),
      ...(categoryId && { categoryId }),
    };
    return this.expenseUseCase.getExpenses(req.organization.id, filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all active expense categories' })
  @Permissions('expense:view')
  async getCategories(@Req() req) {
    return this.expenseUseCase.getExpenseCategories(req.organization.id);
  }
}
