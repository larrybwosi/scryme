import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { db } from "@repo/db";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client = db;

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log("Database connected");
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    this.logger.log("Database disconnected");
  }
}
