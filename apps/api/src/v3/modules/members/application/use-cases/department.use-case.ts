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
import { PlaneApiClient } from "@repo/shared";
import { Logger } from "@nestjs/common";

@Injectable()
export class DepartmentUseCase {
  private readonly logger = new Logger(DepartmentUseCase.name);
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
    // SECURITY (Sentinel): IDOR validation for linked entities.
    if (dto.parentId) {
      const parent = await this.prisma.client.department.findFirst({
        where: { id: dto.parentId, organizationId },
      });
      if (!parent) {
        throw new BadRequestException("Parent department not found");
      }
    }

    if (dto.headId) {
      const head = await this.prisma.client.member.findFirst({
        where: { id: dto.headId, organizationId },
      });
      if (!head) {
        throw new BadRequestException("Head member not found");
      }
    }

    if (dto.locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId },
      });
      if (!location) {
        throw new BadRequestException("Location not found");
      }
    }

    if (dto.costCenterId) {
      const costCenter = await this.prisma.client.costCenter.findFirst({
        where: { id: dto.costCenterId, organizationId },
      });
      if (!costCenter) {
        throw new BadRequestException("Cost center not found");
      }
    }

    const department = await this.prisma.client.department.create({
      data: {
        name: dto.name,
        description: dto.description,
        image: dto.image,
        headId: dto.headId,
        parentId: dto.parentId,
        locationId: dto.locationId,
        costCenterId: dto.costCenterId,
        settings: dto.settings,
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
    // SECURITY (Sentinel): Find-then-update pattern for multi-tenant isolation.
    const currentDepartment = await this.prisma.client.department.findFirst({
      where: { id, organizationId },
    });

    if (!currentDepartment) throw new NotFoundException("Department not found");

    // SECURITY (Sentinel): IDOR validation for linked entities.
    if (dto.parentId) {
      const parent = await this.prisma.client.department.findFirst({
        where: { id: dto.parentId, organizationId },
      });
      if (!parent) {
        throw new BadRequestException("Parent department not found");
      }
    }

    if (dto.headId) {
      const head = await this.prisma.client.member.findFirst({
        where: { id: dto.headId, organizationId },
      });
      if (!head) {
        throw new BadRequestException("Head member not found");
      }
    }

    if (dto.locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId },
      });
      if (!location) {
        throw new BadRequestException("Location not found");
      }
    }

    if (dto.costCenterId) {
      const costCenter = await this.prisma.client.costCenter.findFirst({
        where: { id: dto.costCenterId, organizationId },
      });
      if (!costCenter) {
        throw new BadRequestException("Cost center not found");
      }
    }

    const department = await this.prisma.client.department.update({
      where: { id: currentDepartment.id },
      data: {
        name: dto.name,
        description: dto.description,
        image: dto.image,
        headId: dto.headId,
        parentId: dto.parentId,
        locationId: dto.locationId,
        costCenterId: dto.costCenterId,
        settings: dto.settings,
      },
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
    // SECURITY (Sentinel): Find-then-delete pattern for multi-tenant isolation.
    const currentDepartment = await this.prisma.client.department.findFirst({
      where: { id, organizationId },
    });

    if (!currentDepartment) throw new NotFoundException("Department not found");

    const department = await this.prisma.client.department.delete({
      where: { id: currentDepartment.id },
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
        include: { user: { select: { email: true, scrymeUserId: true } } }
      });

      if (fullDept && fullMember?.user?.email) {
        const { scrymeConfiguration, planeConfiguration, slug } = fullDept.organization;

        if (scrymeConfiguration?.workspaceSlug && scrymeConfiguration.isActive) {
          let channelId = fullDept.scrymeChannelId;

          // Enterprise: Automatically create channel if missing
          if (!channelId) {
            this.logger.log(`Scryme channel missing for department ${fullDept.name}, creating...`);
            try {
              const channelSlug = `dept-${fullDept.name.toLowerCase().replace(/\s+/g, '-')}`;
              const channel = await this.scrymeClient.createChannel(
                scrymeConfiguration.workspaceSlug,
                fullDept.name,
                channelSlug,
              );
              channelId = channel.id;
              await this.prisma.client.department.update({
                where: { id: departmentId },
                data: { scrymeChannelId: channelId },
              });
            } catch (err: any) {
              this.logger.error(`Failed to auto-create Scryme channel: ${err.message}`);
            }
          }

          if (channelId) {
            try {
              await this.scrymeClient.addUserToChannel(
                scrymeConfiguration.workspaceSlug,
                channelId,
                fullMember.user.email,
              );
            } catch (err: any) {
            // If user not found, try robust mapping
            if (
              err.response?.status === 404 &&
              fullMember.user.scrymeUserId
            ) {
              this.logger.warn(
                `Email-based add failed for ${fullMember.user.email}, retrying with scrymeUserId`,
              );
              // Scryme API might have an ID-based add method or we use sync
            }
            throw err;
          }
        }
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
    // SECURITY (Sentinel): Verify department belongs to organization before removing member.
    const dept = await this.prisma.client.department.findFirst({
      where: { id: departmentId, organizationId },
    });

    if (!dept) throw new NotFoundException("Department not found");

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
