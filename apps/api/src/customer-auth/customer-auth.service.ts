import { getRedisClient } from "@repo/shared/redis";
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./prisma/generated-client";
import { PrismaPg } from "@prisma/adapter-pg";
import amqp from "amqplib";
import { env } from "@repo/env";

@Injectable()
export class CustomerAuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerAuthService.name);
  public auth: any;
  private prisma: PrismaClient;
  private rabbitConnection: amqp.ChannelModel | null = null;
  private rabbitChannel: amqp.Channel | null = null;

  constructor() {
    const adapter = new PrismaPg({ connectionString: env.CUSTOMER_DB });
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.initRabbitMQ();
    this.initBetterAuth();
  }

  async onModuleDestroy() {
    try {
      await this.rabbitChannel?.close();
      await this.rabbitConnection?.close();
    } catch (e) {
      this.logger.error("Failed to safely teardown RabbitMQ connection", e);
    }
  }

  private async initRabbitMQ() {
    try {
      const rabbitUrl = env.RABBITMQ_URL || "amqp://localhost:5672";
      this.rabbitConnection = await amqp.connect(rabbitUrl);
      this.rabbitChannel = await this.rabbitConnection.createChannel();
      await this.rabbitChannel.assertExchange(
        "customer-auth-exchange",
        "topic",
        {
          durable: true,
        },
      );
      this.logger.log(
        "RabbitMQ initialized successfully in Customer Auth Service.",
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to connect to RabbitMQ, proceeding in fallback/retry mode: ${error.message}`,
      );
    }
  }

  private async publishEvent(routingKey: string, data: any) {
    if (this.rabbitChannel) {
      try {
        this.rabbitChannel.publish(
          "customer-auth-exchange",
          routingKey,
          Buffer.from(JSON.stringify(data)),
        );
        this.logger.log(`Published event ${routingKey} to RabbitMQ`);
      } catch (err) {
        this.logger.error("Failed to publish RabbitMQ event:", err);
      }
    } else {
      this.logger.log(
        `RabbitMQ offline. Simulation log event ${routingKey}: ${JSON.stringify(data)}`,
      );
    }
  }

  private initBetterAuth() {
    this.auth = betterAuth({
      database: prismaAdapter(this.prisma, {
        provider: "postgresql",
      }),
      basePath: "/api/customer-auth",
      secret:
        env.CUSTOMER_BETTER_AUTH_SECRET ||
        "default_customer_auth_secret_32_chars",
      socialProviders: {
        google: {
          clientId: env.CUSTOMER_GOOGLE_CLIENT_ID || "google-client-id",
          clientSecret:
            env.CUSTOMER_GOOGLE_CLIENT_SECRET || "google-client-secret",
        },
      },
      rateLimit: {
        enabled: env.NODE_ENV !== "test",
        window: 60,
        max: 1000,
        storage: "secondary-storage",
        customRules: {
          "/get-session": false,
          "/sign-in/*": env.NODE_ENV === "development" ? false : { window: 60, max: 60 },
          "/sign-in/email": env.NODE_ENV === "development" ? false : { window: 60, max: 60 },
          "/sign-in/passkey": env.NODE_ENV === "development" ? false : { window: 60, max: 60 },
          "/sign-in/social": env.NODE_ENV === "development" ? false : { window: 60, max: 60 },
          "/sign-up/*": env.NODE_ENV === "development" ? false : { window: 60, max: 60 },
          "/sign-up/email": env.NODE_ENV === "development" ? false : { window: 60, max: 60 },
        },
      },
      secondaryStorage: {
        get: async (key: string): Promise<string | null> => {
          try {
            const redis = await getRedisClient();
            const value = await redis.get(key);
            if (value === null || value === undefined) return null;
            if (typeof value === "string") return value;
            return JSON.stringify(value);
          } catch (e: unknown) {
            return null;
          }
        },
        set: async (key: string, value: string, ttl?: number): Promise<void> => {
          try {
            const redis = await getRedisClient();
            if (ttl) {
              await redis.setex(key, ttl, value);
            } else {
              await redis.setex(key, 3600, value);
            }
          } catch (e: unknown) {
            // ignore
          }
        },
        delete: async (key: string): Promise<void> => {
          try {
            const redis = await getRedisClient();
            await redis.del(key);
          } catch (e: unknown) {
            // ignore
          }
        },
        getAndDelete: async (key: string): Promise<string | null> => {
          try {
            const redis = await getRedisClient();
            const value = await redis.get(key);
            if (value !== null && value !== undefined) {
              await redis.del(key);
            }
            if (value === null || value === undefined) return null;
            if (typeof value === "string") return value;
            return JSON.stringify(value);
          } catch (e: unknown) {
            return null;
          }
        },
        increment: async (key: string, ttl: number = 60): Promise<number> => {
          try {
            const redis = await getRedisClient();
            const value = await redis.incr(key);
            if (value === 1) {
              await redis.expire(key, Math.max(1, ttl));
            } else {
              const currentTtl = await redis.ttl(key);
              if (currentTtl < 0) {
                await redis.expire(key, Math.max(1, ttl));
              }
            }
            return value;
          } catch (e: unknown) {
            return 0;
          }
        },
      } as any,
      databaseHooks: {
        user: {
          create: {
            after: async user => {
              await this.publishEvent("customer.registered", {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              });
            },
          },
        },
      },
    });
  }
}
