import {Controller, Get, Post, Body, Req, UseGuards} from "@nestjs/common";
import {B2BUseCase} from "../../application/use-cases/b2b.use-case";
import {V3AuthGuard} from "@/v3/common/guards/v3-auth.guard";
import {MultiTenancyGuard} from "@/v3/common/guards/multi-tenancy.guard";

@Controller(":orgSlug/b2b")
@UseGuards(V3AuthGuard, MultiTenancyGuard)
export class B2BController {
  constructor(private readonly b2bUseCase: B2BUseCase) {}

  @Get("catalog")
  async getCatalog(@Req() req: any) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.getCatalog(organizationId, businessAccountId);
  }

  @Get("invoices")
  async getInvoices(@Req() req: any) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.getInvoices(organizationId, businessAccountId);
  }

  @Get("orders")
  async getOrders(@Req() req: any) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.getOrders(organizationId, businessAccountId);
  }

  @Post("orders")
  async createOrder(@Req() req: any, @Body() data: any) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.createOrder(organizationId, businessAccountId, data);
  }
}
