import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { db } from '@repo/db';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly client = db;

  async onModuleInit() {}
  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
