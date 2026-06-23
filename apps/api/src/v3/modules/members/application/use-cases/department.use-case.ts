import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
  AddDepartmentMemberDto,
} from "../dto/department.dto";
import { AuditLogAction, AuditEntityType } from "@repo/db";
import { ScrymeChatApiClient } from "@repo/scryme";
import { PlaneApiClient } from "@repo/plane";

@Injectable()
export class DepartmentUseCase {
  private scrymeClient: ScrymeChatApiClient;
  private planeClient: PlaneApiClient;

  constructor(private readonly prisma: PrismaService) {
    this.scrymeClient = new ScrymeChatApiClient();
    this.planeClient = new PlaneApiClient();
  }

  async getDepartments(organizationId: string, query: DepartmentQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [total, items] = await Promise.all([
      this.prisma.client.department.count({ where }),
      this.prisma.client.department.findMany({
        where,
        // ⚡ Bolt Optimization: Targeted select for list view to reduce
        // data transfer and avoid fetching sensitive head member fields.
        select: {
          id: true,
          name: true,
          image: true,
          description: true,
          organizationId: true,
          createdAt: true,
          head: {
            select: {
              id: true,
              user: { select: { name: true, image: true } },
            },
          },
          _count: { select: { departmentMembers: true } },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDepartment(organizationId: string, id: string) {
    const department = await this.prisma.client.department.findFirst({
      where: { id, organizationId },
      // ⚡ Bolt Optimization: Replace deep 'include' with targeted 'select'
      // to avoid over-fetching member details (like pinHash) and reduce payload size.
      select: {
        id: true,
        name: true,
        image: true,
        banner: true,
        description: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
        locationId: true,
        costCenterId: true,
        scrymeChannelId: true,
        planeProjectId: true,
        head: {
          select: {
            id: true,
            role: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
        departmentMembers: {
          select: {
            id: true,
            role: true,
            canApproveExpenses: true,
            canManageBudget: true,
            member: {
              select: {
                id: true,
                role: true,
                isActive: true,
                user: { select: { name: true, email: true, image: true } },
              },
            },
          },
        },
      },
    });

    if (!department) throw new NotFoundException("Department not found");
    return department;
  }

  async createDepartment(
    organizationId: string,
    dto: CreateDepartmentDto,
    actorId: string,
  ) {
    const department = await this.prisma.client.department.create({
      data: {
        ...dto,
        organizationId,
      },
    });

    // Handle Integrations (Scryme & Plane)
    try {
      const [scrymeConfig, planeConfig] = await Promise.all([
        this.prisma.client.scrymeConfiguration.findUnique({ where: { organizationId } }),
        this.prisma.client.planeConfiguration.findUnique({ where: { organizationId } }),
      ]);

      const updates: any = {};

      if (scrymeConfig?.workspaceSlug && scrymeConfig.isActive) {
        const channelSlug = `dept-${department.name.toLowerCase().replace(/\s+/g, '-')}`;
        const channel = await this.scrymeClient.createChannel(
          scrymeConfig.workspaceSlug,
          department.name,
          channelSlug,
        );
        updates.scrymeChannelId = channel.id;
      }

      if (planeConfig?.workspaceSlug && planeConfig.isActive) {
        const projectIdentifier = department.name.substring(0, 3).toUpperCase();
        const project = await this.planeClient.createProject(
          planeConfig.workspaceSlug,
          department.name,
          projectIdentifier,
        );
        updates.planeProjectId = project.id;
      }

      if (Object.keys(updates).length > 0) {
        await this.prisma.client.department.update({
          where: { id: department.id },
          data: updates,
        });
      }
    } catch (error) {
      console.error('Failed to provision integrations for department:', error);
    }

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.CREATE,
        entityType: AuditEntityType.ORGANIZATION, // Fallback to ORGANIZATION if DEPARTMENT is missing
        entityId: department.id,
        description: `Created department: ${department.name}`,
      },
    });

    return department;
  }

  async updateDepartment(
    organizationId: string,
    id: string,
    dto: UpdateDepartmentDto,
    actorId: string,
  ) {
    const department = await this.prisma.client.department.update({
      where: { id, organizationId },
      data: dto,
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.UPDATE,
        entityType: AuditEntityType.ORGANIZATION,
        entityId: department.id,
        description: `Updated department: ${department.name}`,
      },
    });

    return department;
  }

  async deleteDepartment(organizationId: string, id: string, actorId: string) {
    const department = await this.prisma.client.department.delete({
      where: { id, organizationId },
    });

    await this.prisma.client.auditLog.create({
      data: {
        organizationId,
        memberId: actorId,
        action: AuditLogAction.DELETE,
        entityType: AuditEntityType.ORGANIZATION,
        entityId: department.id,
        description: `Deleted department: ${department.name}`,
      },
    });

    return department;
  }

  async addMemberToDepartment(
    organizationId: string,
    departmentId: string,
    dto: AddDepartmentMemberDto,
    actorId: string,
  ) {
    // Verify department and member belong to org
    const [dept, member] = await Promise.all([
      this.prisma.client.department.findFirst({
        where: { id: departmentId, organizationId },
      }),
      this.prisma.client.member.findFirst({
        where: { id: dto.memberId, organizationId },
      }),
    ]);

    if (!dept) throw new NotFoundException("Department not found");
    if (!member) throw new NotFoundException("Member not found");

    const membership = await this.prisma.client.departmentMember.upsert({
      where: {
        departmentId_memberId: {
          departmentId,
          memberId: dto.memberId,
        },
      },
      update: {
        role: dto.role,
        canApproveExpenses: dto.canApproveExpenses,
        canManageBudget: dto.canManageBudget,
      },
      create: {
        departmentId,
        memberId: dto.memberId,
        role: dto.role,
        canApproveExpenses: dto.canApproveExpenses,
        canManageBudget: dto.canManageBudget,
      },
    });

    // Automatic Sync to Integrations
    try {
      const fullDept = await this.prisma.client.department.findUnique({
        where: { id: departmentId },
        include: { organization: { include: { scrymeConfiguration: true, planeConfiguration: true } } }
      });
      const fullMember = await this.prisma.client.member.findUnique({
        where: { id: dto.memberId },
        include: { user: { select: { email: true } } }
      });

      if (fullDept && fullMember?.user?.email) {
        const { scrymeConfiguration, planeConfiguration, slug } = fullDept.organization;

        if (fullDept.scrymeChannelId && scrymeConfiguration?.workspaceSlug) {
          await this.scrymeClient.addUserToChannel(
            scrymeConfiguration.workspaceSlug,
            fullDept.scrymeChannelId, // Assuming Scryme API accepts ID or Slug
            fullMember.user.email
          );
        }

        if (fullDept.planeProjectId && planeConfiguration?.workspaceSlug) {
           // Plane requires adding to workspace first, then project
           await this.planeClient.addWorkspaceMember(planeConfiguration.workspaceSlug, fullMember.user.email);
           await this.planeClient.addProjectMember(planeConfiguration.workspaceSlug, fullDept.planeProjectId, fullMember.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync member to integrations:', error);
    }

    return membership;
  }

  async removeMemberFromDepartment(
    organizationId: string,
    departmentId: string,
    memberId: string,
    actorId: string,
  ) {
    await this.prisma.client.departmentMember.delete({
      where: {
        departmentId_memberId: {
          departmentId,
          memberId,
        },
      },
    });

    return { success: true };
  }
}
