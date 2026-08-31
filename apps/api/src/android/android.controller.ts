import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { AndroidAuthGuard } from "./android.guard";
import { AllowPublic } from "../common/decorators/auth.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { MemberUseCase } from "../v3/modules/members/application/use-cases/member.use-case";
import { AttendanceUseCase } from "../v3/modules/members/application/use-cases/attendance.use-case";
import { ExpenseUseCase } from "../v3/modules/finance/application/use-cases/expense.use-case";
import { GetTransactionsUseCase } from "../v3/modules/pos/application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "../v3/modules/pos/application/use-cases/register-petty-cash.use-case";
import { ReviewPriceChangeUseCase } from "../v3/modules/catalog/application/use-cases/review-price-change.use-case";
import {
  GetStockAdjustmentsUseCase,
  ApproveStockAdjustmentUseCase,
  RejectStockAdjustmentUseCase,
} from "../v3/modules/inventory/application/use-cases/adjustment-workflow.use-case";
import { StaffSchedulingService } from "../v3/modules/services/application/services/staff-scheduling.service";
import { emitEvent } from "@repo/shared/server";
import { db } from "@repo/db";
import { ScrymeChatApiClient } from "@repo/chat";

@UseGuards(AndroidAuthGuard)
@Controller("android")
export class AndroidController {
  private readonly scrymeClient = new ScrymeChatApiClient();
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly memberUseCase: MemberUseCase,
    private readonly attendanceUseCase: AttendanceUseCase,
    private readonly expenseUseCase: ExpenseUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly registerPettyCashUseCase: RegisterPettyCashUseCase,
    private readonly reviewPriceChangeUseCase: ReviewPriceChangeUseCase,
    private readonly getStockAdjustmentsUseCase: GetStockAdjustmentsUseCase,
    private readonly approveStockAdjustmentUseCase: ApproveStockAdjustmentUseCase,
    private readonly rejectStockAdjustmentUseCase: RejectStockAdjustmentUseCase,
    private readonly staffSchedulingService: StaffSchedulingService,
  ) {}

  // --- AUTH ENDPOINTS ---

  @AllowPublic()
  @Post("auth/sign-in/email")
  async signInWithEmail(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.headers.host || req.hostname;
    const url = `${protocol}://${host}/api/auth/sign-in/email`;

    const headers = new Headers(req.headers as HeadersInit);
    const request = new Request(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(req.body),
    });

    const response = await this.authService.auth.handler(request);

    if (response.status !== 200) {
      res.status(response.status);
      return res.send(await response.json());
    }

    const json = await response.json();
    let token = response.headers.get("set-auth-token");
    if (!token) {
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
        if (match) token = match[1];
      }
    }
    if (!token && typeof response.headers.getSetCookie === "function") {
      const cookies = response.headers.getSetCookie();
      for (const cookie of cookies) {
        const match = cookie.match(/better-auth\.session_token=([^;]+)/);
        if (match) {
          token = match[1];
          break;
        }
      }
    }
    if (!token && json.session?.id) {
      const sess = await db.session.findUnique({
        where: { id: json.session.id },
        select: { token: true },
      });
      if (sess) token = sess.token;
    }

    res.status(200);
    let orgId = json.user?.activeOrganizationId;
    if (!orgId && json.user?.id) {
      const firstMembership = await this.prisma.client.member.findFirst({
        where: { userId: json.user.id, deletedAt: null },
        select: { organizationId: true },
      });
      if (firstMembership) orgId = firstMembership.organizationId;
    }
    const org = orgId
      ? await this.prisma.client.organization.findUnique({ where: { id: orgId } })
      : null;
    return res.send({
      success: true,
      token: token || null,
      user: {
        ...json.user,
        activeOrganizationId: org?.id || json.user?.activeOrganizationId || null,
        activeOrganizationSlug: org?.slug || null,
        activeOrganizationName: org?.name || null,
      },
    });
  }

  @Get("auth/get-session")
  async getSession(@Req() req: any) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: req.user.id },
    });
    let orgId = user?.activeOrganizationId || req.organization?.id;
    if (!orgId && user?.id) {
      const firstMembership = await this.prisma.client.member.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { organizationId: true },
      });
      if (firstMembership) orgId = firstMembership.organizationId;
    }
    const org = orgId
      ? await this.prisma.client.organization.findUnique({ where: { id: orgId } })
      : req.organization;
    return {
      success: true,
      token: req.androidToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        activeOrganizationId: org?.id || user?.activeOrganizationId || null,
        activeOrganizationSlug: org?.slug || null,
        activeOrganizationName: org?.name || null,
      },
    };
  }

  @AllowPublic()
  @Post("auth/terminal-login")
  async terminalLogin(@Body() dto: { cardId: string; pin: string }, @Req() req: any) {
    const orgSlug = req.headers["x-organization-slug"] || req.headers["x-org-slug"];
    const orgIdHeader = req.headers["x-organization-id"] || req.headers["x-org-id"];

    let organizationId: string | undefined = undefined;

    if (orgIdHeader) {
      organizationId = Array.isArray(orgIdHeader) ? orgIdHeader[0] : orgIdHeader;
    } else if (orgSlug) {
      const slugStr = Array.isArray(orgSlug) ? orgSlug[0] : orgSlug;
      const org = await this.prisma.client.organization.findUnique({
        where: { slug: slugStr },
      });
      if (org) {
        organizationId = org.id;
      }
    }

    if (!organizationId) {
      throw new BadRequestException("Organization context is missing");
    }

    let locationId = req.headers["x-location-id"];
    if (Array.isArray(locationId)) {
      locationId = locationId[0];
    }
    if (!locationId) {
      const firstLoc = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId, isActive: true },
      });
      if (firstLoc) {
        locationId = firstLoc.id;
      }
    }

    const data = await this.memberUseCase.login(
      organizationId,
      locationId,
      dto.cardId,
      dto.pin,
    );

    return {
      success: true,
      data,
    };
  }

  @AllowPublic()
  @Post("auth/login/social/google")
  async signInWithGoogle(@Req() req: any, @Res() res: any) {
    const protocol = req.protocol;
    const host = req.headers.host || req.hostname;
    const url = `${protocol}://${host}/api/auth/login/social/google`;

    const headers = new Headers(req.headers as HeadersInit);
    const request = new Request(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(req.body),
    });

    const response = await this.authService.auth.handler(request);

    if (response.status !== 200) {
      res.status(response.status);
      return res.send(await response.json());
    }

    const json = await response.json();
    let token = response.headers.get("set-auth-token");
    if (!token) {
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    res.status(200);
    return res.send({
      success: true,
      token: token || null,
      user: json.user,
    });
  }

  // --- ORGANIZATION DETAILS ---

  @Get(":orgSlug/organization")
  async getOrganizationDetails(@Req() req: any) {
    const orgId = req.v3Context.organizationId;
    const [org, locationsCount, membersCount] = await Promise.all([
      this.prisma.client.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          address: true,
          taxId: true,
          registrationNumber: true,
          logo: true,
          createdAt: true,
          settings: {
            select: {
              defaultCurrency: true,
            },
          },
        },
      }),
      this.prisma.client.inventoryLocation.count({
        where: { organizationId: orgId, isActive: true },
      }),
      this.prisma.client.member.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
    ]);

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return {
      success: true,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email || null,
        phone: org.phone || null,
        address: org.address || null,
        taxId: org.taxId || null,
        registrationNumber: org.registrationNumber || null,
        logo: org.logo || null,
        createdAt: org.createdAt ? org.createdAt.toISOString() : null,
        currencyCode: org.settings?.defaultCurrency || "USD",
        locationsCount,
        membersCount,
      },
    };
  }

  // --- MEMBERS & PRESENCE ENDPOINTS ---

  @Get(":orgSlug/locations")
  async getLocations(@Req() req: any) {
    const data = await this.prisma.client.inventoryLocation.findMany({
      where: {
        organizationId: req.v3Context.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
        isActive: true,
      },
    });
    return {
      success: true,
      data,
    };
  }

  @Get(":orgSlug/members")
  async getMembers(@Req() req: any, @Query() query: any) {
    const isCheckedIn = query.isCheckedIn === "true" || query.isCheckedIn === true ? true : query.isCheckedIn === "false" || query.isCheckedIn === false ? false : undefined;
    const res = await this.memberUseCase.getMembers(req.v3Context.organizationId, {
      role: query.role,
      membershipStatus: query.membershipStatus,
      isActive: query.isActive === "true" || query.isActive === true ? true : query.isActive === "false" || query.isActive === false ? false : undefined,
      status: query.status,
      isCheckedIn,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
    return {
      success: true,
      data: res.items,
    };
  }

  @Get(":orgSlug/members/attendance/logs")
  async getAttendanceLogs(@Req() req: any, @Query() query: any) {
    const data = await this.attendanceUseCase.getAttendanceLogs(req.v3Context.organizationId, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      memberId: query.memberId,
      locationId: query.locationId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return {
      success: true,
      data,
    };
  }

  @Post(":orgSlug/members/attendance/check-in")
  async checkIn(@Req() req: any, @Body() dto: any) {
    const memberId = req.v3Context.memberId;
    if (!memberId) throw new BadRequestException("Member context required for check-in");
    const data = await this.attendanceUseCase.checkIn(
      req.v3Context.organizationId,
      memberId,
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  @Post(":orgSlug/members/attendance/check-out")
  async checkOut(@Req() req: any, @Body() dto: any) {
    const memberId = req.v3Context.memberId;
    if (!memberId) throw new BadRequestException("Member context required for check-out");
    const data = await this.attendanceUseCase.checkOut(
      req.v3Context.organizationId,
      memberId,
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  @Post(":orgSlug/members/:memberId/attendance/check-out")
  async adminCheckOut(
    @Req() req: any,
    @Param("memberId") memberId: string,
    @Body() dto: any,
  ) {
    const data = await this.attendanceUseCase.checkOut(
      req.v3Context.organizationId,
      memberId,
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  // --- POS & PETTY CASH ENDPOINTS ---

  @Get(":orgSlug/pos/petty-cash/transactions")
  async getPettyCashTransactions(@Req() req: any, @Query("limit") limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const data = await this.registerPettyCashUseCase.getRecentTransactions(req.v3Context, parsedLimit);
    return {
      success: true,
      data,
    };
  }

  @Get(":orgSlug/pos/transactions")
  async getTransactions(@Req() req: any, @Query() query: any) {
    const res = await this.getTransactionsUseCase.execute(req.v3Context, query);
    return {
      success: true,
      data: res.data,
    };
  }

  // --- CATALOG & PRICE CHANGE REQUESTS ---

  @Get(":orgSlug/catalog/price-change-requests")
  async getPriceChangeRequests(@Req() req: any, @Query() query: any) {
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = query.offset ? parseInt(query.offset, 10) : 0;
    const data = await this.prisma.client.priceChangeRequest.findMany({
      where: { organizationId: req.v3Context.organizationId },
      include: {
        priceListItem: {
          select: {
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
      take: limit,
      skip,
    });
    return {
      success: true,
      data,
    };
  }

  @Post(":orgSlug/catalog/price-change-requests/:id/review")
  async reviewPriceChange(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: { status: string; rejectionReason?: string },
  ) {
    const memberId = req.v3Context.memberId;
    if (!memberId) throw new BadRequestException("Member context required for review");
    await this.reviewPriceChangeUseCase.execute({
      organizationId: req.v3Context.organizationId,
      requestId: id,
      memberId,
      status: dto.status as any,
      rejectionReason: dto.rejectionReason,
    });
    return {
      success: true,
      data: null,
    };
  }

  // --- INVENTORY ADJUSTMENTS ENDPOINTS ---

  @Get(":orgSlug/inventory/adjustments")
  async getStockAdjustments(@Req() req: any, @Query() query: any) {
    const res = await this.getStockAdjustmentsUseCase.execute(req.v3Context.organizationId, query);
    return {
      success: true,
      data: res.items,
    };
  }

  @Patch(":orgSlug/inventory/adjustments/:id/approve")
  async approveInventoryAdjustment(@Req() req: any, @Param("id") id: string) {
    await this.approveStockAdjustmentUseCase.execute(
      req.v3Context.organizationId,
      req.v3Context.memberId,
      id,
    );
    return {
      success: true,
      data: null,
    };
  }

  @Patch(":orgSlug/inventory/adjustments/:id/reject")
  async rejectInventoryAdjustment(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: { reason?: string },
  ) {
    await this.rejectStockAdjustmentUseCase.execute(
      req.v3Context.organizationId,
      req.v3Context.memberId,
      id,
      dto.reason,
    );
    return {
      success: true,
      data: null,
    };
  }

  // --- ANALYTICS ENDPOINTS ---

  @Get(":orgSlug/analytics/dashboard")
  async getDashboardAnalytics(@Req() req: any) {
    const organizationId = req.v3Context.organizationId;

    // ⚡ Bolt Optimization: Parallelize all independent database queries.
    // Executing independent count, findMany, and select queries concurrently using Promise.all
    // shrinks total database API wait time from O(4T) down to O(T).
    const [totalCheckedInNow, logs, locations, completedLogs] = await Promise.all([
      this.prisma.client.member.count({
        where: { organizationId, isCheckedIn: true, deletedAt: null },
      }),
      this.prisma.client.attendanceLog.findMany({
        where: { organizationId },
        select: { checkInTime: true },
        take: 1000,
      }),
      this.prisma.client.inventoryLocation.findMany({
        where: { organizationId, isActive: true },
        include: {
          checkInAttendanceLogs: {
            where: { checkOutTime: null },
            select: { id: true },
          },
        },
      }),
      this.prisma.client.attendanceLog.findMany({
        where: { organizationId, NOT: { checkOutTime: null } },
        select: { checkInLocationId: true, durationMinutes: true },
        take: 500,
      }),
    ]);

    const hourCounts: { [hour: number]: number } = {};
    for (const log of logs) {
      const hr = new Date(log.checkInTime).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    }
    const peakHours = Object.keys(hourCounts).map((hr) => ({
      hour: parseInt(hr, 10),
      count: hourCounts[hr],
    })).sort((a, b) => b.count - a.count);

    // ⚡ Bolt Optimization: Group completed logs by locationId in-memory using a Map.
    // Indexing items into a Map prior to mapping avoids a nested array search (O(N * M) down to O(N + M)),
    // yielding an optimal execution profile for branch statistics calculation.
    const completedLogsByLocation = new Map<string, any[]>();
    for (const log of completedLogs) {
      if (log.checkInLocationId) {
        if (!completedLogsByLocation.has(log.checkInLocationId)) {
          completedLogsByLocation.set(log.checkInLocationId, []);
        }
        completedLogsByLocation.get(log.checkInLocationId)!.push(log);
      }
    }

    const branchStats = locations.map((loc) => {
      const activePresenceCount = loc.checkInAttendanceLogs.length;
      const locCompletedLogs = completedLogsByLocation.get(loc.id) || [];
      const totalDuration = locCompletedLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const averageDurationMinutes = locCompletedLogs.length > 0 ? totalDuration / locCompletedLogs.length : 0.0;
      return {
        locationId: loc.id,
        locationName: loc.name,
        activePresenceCount,
        averageDurationMinutes,
      };
    });

    return {
      success: true,
      data: {
        totalCheckedInNow,
        peakHours,
        branchStats,
      },
    };
  }

  // --- ANNOUNCEMENT & MESSAGING ENDPOINTS ---

  @Post(":orgSlug/announcements")
  async broadcastAnnouncement(@Req() req: any, @Body() dto: any) {
    const organizationId = req.v3Context.organizationId;
    const channelSlug = dto.channelSlug || "announcements";

    await emitEvent(organizationId, "announcement.broadcast", {
      title: dto.title,
      message: dto.message,
      targetBranchId: dto.targetBranchId,
      targetMemberId: dto.targetMemberId,
      channelSlug,
      severity: dto.severity || "INFO",
      broadcastBy: req.v3Context.memberId,
    });

    try {
      const config = await this.prisma.client.scrymeConfiguration.findUnique({
        where: { organizationId },
      });
      if (config && config.isActive && config.workspaceSlug) {
        const severityTag = dto.severity ? `[${dto.severity.toUpperCase()}] ` : "";
        const formattedMessage = `📢 **${dto.title}** ${severityTag}\n\n${dto.message}`;
        await this.scrymeClient.sendMessage(config.workspaceSlug, channelSlug, {
          content: formattedMessage,
        });
      }
    } catch (err: any) {
      // Swallowed so announcement completion isn't blocked if chat workspace is inactive
    }

    return {
      success: true,
      data: null,
    };
  }

  @Post(":orgSlug/members/messages")
  async sendMessageToMember(@Req() req: any, @Body() dto: { memberId: string; title: string; message: string; type?: string }) {
    const organizationId = req.v3Context.organizationId;
    if (!dto.memberId) {
      throw new BadRequestException("Member ID is required to send direct member message");
    }

    await emitEvent(organizationId, "member.message.sent", {
      memberId: dto.memberId,
      title: dto.title,
      message: dto.message,
      type: dto.type || "DIRECT_MESSAGE",
      sentBy: req.v3Context.memberId,
    });

    try {
      const targetMember = await this.prisma.client.member.findUnique({
        where: { id: dto.memberId },
        include: { user: { select: { email: true } } },
      });
      const config = await this.prisma.client.scrymeConfiguration.findUnique({
        where: { organizationId },
      });
      if (config && config.isActive && config.workspaceSlug && targetMember?.user?.email) {
        const scrymeUser = await this.scrymeClient.findUserByEmail(config.workspaceSlug, targetMember.user.email);
        if (scrymeUser?.id) {
          const dmChannel = await this.scrymeClient.getDirectMessageChannel(config.workspaceSlug, scrymeUser.id);
          if (dmChannel?.slug) {
            const formattedMessage = `💬 **${dto.title}**\n${dto.message}`;
            await this.scrymeClient.sendMessage(config.workspaceSlug, dmChannel.slug, {
              content: formattedMessage,
            });
          }
        }
      }
    } catch (err: any) {
      // Swallowed so direct messaging isn't blocked if chat workspace is inactive
    }

    return {
      success: true,
      data: null,
    };
  }

  // --- FINANCE EXPENSES ENDPOINTS ---

  @Get("finance/expenses")
  async getExpenses(@Req() req: any, @Query() query: any) {
    const data = await this.expenseUseCase.getExpenses(req.v3Context.organizationId, query);
    return {
      success: true,
      data,
    };
  }

  @Get("finance/expenses/categories")
  async getExpenseCategories(@Req() req: any) {
    const data = await this.expenseUseCase.getExpenseCategories(req.v3Context.organizationId);
    return {
      success: true,
      data,
    };
  }

  @Post("finance/expenses")
  async createExpense(@Req() req: any, @Body() dto: any) {
    let memberId = req.v3Context.memberId;
    if (!memberId) {
      const firstMember = await this.prisma.client.member.findFirst({
        where: { organizationId: req.v3Context.organizationId, deletedAt: null },
      });
      if (firstMember) {
        memberId = firstMember.id;
      } else {
        throw new BadRequestException("No active member found for this organization to submit expense");
      }
    }
    const data = await this.expenseUseCase.createExpense(
      req.v3Context.organizationId,
      memberId,
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  @Post("finance/expenses/:id/approve")
  async approveExpense(@Req() req: any, @Param("id") id: string) {
    let memberId = req.v3Context.memberId;
    if (!memberId) {
      const firstMember = await this.prisma.client.member.findFirst({
        where: { organizationId: req.v3Context.organizationId, deletedAt: null },
      });
      if (firstMember) memberId = firstMember.id;
    }
    const data = await this.expenseUseCase.approveExpense(
      req.v3Context.organizationId,
      memberId,
      id,
    );
    return {
      success: true,
      data,
    };
  }

  // --- STAFF SHIFTS & ROSTER ENDPOINTS ---

  @Get(":orgSlug/shifts")
  async getShifts(
    @Req() req: any,
    @Query("memberId") memberId?: string,
    @Query("dayOfWeek") dayOfWeek?: string,
    @Query("isActive") isActive?: string,
  ) {
    const filters: { memberId?: string; dayOfWeek?: number; isActive?: boolean } = {};
    if (memberId) filters.memberId = memberId;
    if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== "") {
      filters.dayOfWeek = parseInt(dayOfWeek, 10);
    }
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      filters.isActive = isActive === "true";
    }

    const data = await this.staffSchedulingService.getShifts(
      req.v3Context.organizationId,
      filters,
    );

    return {
      success: true,
      data,
    };
  }

  @Post(":orgSlug/staff/:memberId/shifts")
  async createShift(
    @Req() req: any,
    @Param("memberId") memberId: string,
    @Body() dto: { dayOfWeek: number; startTime: string; endTime: string },
  ) {
    const data = await this.staffSchedulingService.createShift(
      req.v3Context.organizationId,
      memberId,
      dto,
    );

    return {
      success: true,
      data,
    };
  }

  @Post(":orgSlug/shifts/:shiftId/breaks")
  async addBreak(
    @Req() req: any,
    @Param("shiftId") shiftId: string,
    @Body() dto: { startTime: string; endTime: string; description?: string },
  ) {
    const data = await this.staffSchedulingService.addBreak(
      req.v3Context.organizationId,
      shiftId,
      dto,
    );

    return {
      success: true,
      data,
    };
  }
}
