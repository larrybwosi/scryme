import { Test, TestingModule } from '@nestjs/testing';
import { ServiceManagementService } from './application/services/service-management.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ServiceManagementService', () => {
  let service: ServiceManagementService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceManagementService,
        {
          provide: PrismaService,
          useValue: {
            serviceCategory: {
              create: vi.fn(),
              findMany: vi.fn(),
            },
            service: {
              create: vi.fn(),
              findMany: vi.fn(),
              findUnique: vi.fn(),
              findFirst: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ServiceManagementService>(ServiceManagementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
