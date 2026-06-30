import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './application/services/booking.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: {
            serviceBooking: {
              create: vi.fn(),
              findMany: vi.fn(),
              findFirst: vi.fn(),
              update: vi.fn(),
            },
            service: {
              findFirst: vi.fn(),
            },
            bookingConsumedMaterial: {
                create: vi.fn(),
            },
            $transaction: vi.fn().mockImplementation((cb) => cb(prisma)),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
