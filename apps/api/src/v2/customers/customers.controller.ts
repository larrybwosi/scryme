import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import type { V2ApiContext } from '@repo/shared/server';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List or search customers (internal database)' })
  async getCustomers(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.customersService.getCustomers(ctx, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details' })
  async getCustomer(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.customersService.getCustomer(ctx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  async createCustomer(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.customersService.createCustomer(ctx, body);
  }
}
