import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  CreateProjectDto,
  ManageProjectMemberDto,
  ProjectFilterDto,
  UpdateProjectDto,
} from '../../dtos/project.dto';

@Injectable()
export class ProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(organizationId: string, dto: CreateProjectDto, currentMemberId?: string) {
    const existing = await this.prisma.client.project.findFirst({
      where: { organizationId, key: dto.key },
    });
    if (existing) {
      throw new ConflictException(`Project key "${dto.key}" already exists in this organization`);
    }

    if (dto.ownerId) {
      const owner = await this.prisma.client.member.findFirst({
        where: { id: dto.ownerId, organizationId },
      });
      if (!owner) {
        throw new BadRequestException('Specified owner member does not belong to this organization');
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.client.department.findFirst({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) {
        throw new BadRequestException('Specified department does not belong to this organization');
      }
    }

    const project = await this.prisma.client.project.create({
      data: {
        organizationId,
        name: dto.name,
        key: dto.key.toUpperCase(),
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate,
        endDate: dto.endDate,
        ownerId: dto.ownerId || currentMemberId,
        departmentId: dto.departmentId,
        members: currentMemberId
          ? {
              create: {
                memberId: currentMemberId,
                role: 'ADMIN',
              },
            }
          : undefined,
      },
      include: {
        owner: {
          select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } },
        },
        members: {
          include: {
            member: { select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } } },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    return project;
  }

  async getProject(organizationId: string, projectId: string) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        owner: {
          select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } },
        },
        members: {
          include: {
            member: { select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } } },
          },
        },
        labels: true,
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async listProjects(organizationId: string, filter: ProjectFilterDto) {
    const { status, departmentId, search, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: { id: true, user: { select: { name: true, email: true } } },
          },
          _count: {
            select: { tasks: true, members: true },
          },
        },
      }),
      this.prisma.client.project.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProject(organizationId: string, projectId: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.client.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    if (dto.ownerId) {
      const owner = await this.prisma.client.member.findFirst({
        where: { id: dto.ownerId, organizationId },
      });
      if (!owner) {
        throw new BadRequestException('Specified owner member does not belong to this organization');
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.client.department.findFirst({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) {
        throw new BadRequestException('Specified department does not belong to this organization');
      }
    }

    // Tenant isolation hardening: updateMany + findFirstOrThrow
    await this.prisma.client.project.updateMany({
      where: { id: projectId, organizationId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate,
        endDate: dto.endDate,
        ownerId: dto.ownerId,
        departmentId: dto.departmentId,
      },
    });

    return this.getProject(organizationId, projectId);
  }

  async deleteProject(organizationId: string, projectId: string) {
    const existing = await this.prisma.client.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.client.project.deleteMany({
      where: { id: projectId, organizationId },
    });

    return { success: true, id: projectId };
  }

  async manageProjectMember(organizationId: string, projectId: string, dto: ManageProjectMemberDto) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.prisma.client.member.findFirst({
      where: { id: dto.memberId, organizationId },
    });
    if (!member) {
      throw new BadRequestException('Member does not belong to this organization');
    }

    const projectMember = await this.prisma.client.projectMember.upsert({
      where: {
        projectId_memberId: {
          projectId,
          memberId: dto.memberId,
        },
      },
      create: {
        projectId,
        memberId: dto.memberId,
        role: dto.role,
      },
      update: {
        role: dto.role,
      },
      include: {
        member: { select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return projectMember;
  }

  async removeProjectMember(organizationId: string, projectId: string, memberId: string) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.client.projectMember.deleteMany({
      where: { projectId, memberId },
    });

    return { success: true, memberId };
  }
}
