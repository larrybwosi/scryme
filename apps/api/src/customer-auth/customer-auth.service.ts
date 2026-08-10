import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "./prisma/generated-client";
import amqp from "amqplib";

@Injectable()
export class CustomerAuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerAuthService.name);
  public auth: any;
  private prisma: PrismaClient;
  private rabbitConnection: amqp.ChannelModel | null = null;
  private rabbitChannel: amqp.Channel | null = null;

  constructor() {
    this.prisma = new PrismaClient();
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
      const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
      this.rabbitConnection = await amqp.connect(rabbitUrl);
      this.rabbitChannel = await this.rabbitConnection.createChannel();
      await this.rabbitChannel.assertExchange("customer-auth-exchange", "topic", {
        durable: true,
      });
      this.logger.log("RabbitMQ initialized successfully in Customer Auth Service.");
    } catch (error: any) {
      this.logger.warn(`Failed to connect to RabbitMQ, proceeding in fallback/retry mode: ${error.message}`);
    }
  }

  private async publishEvent(routingKey: string, data: any) {
    if (this.rabbitChannel) {
      try {
        this.rabbitChannel.publish(
          "customer-auth-exchange",
          routingKey,
          Buffer.from(JSON.stringify(data))
        );
        this.logger.log(`Published event ${routingKey} to RabbitMQ`);
      } catch (err) {
        this.logger.error("Failed to publish RabbitMQ event:", err);
      }
    } else {
      this.logger.log(`RabbitMQ offline. Simulation log event ${routingKey}: ${JSON.stringify(data)}`);
    }
  }

  private initBetterAuth() {
    this.auth = betterAuth({
      database: prismaAdapter(this.prisma, {
        provider: "sqlite",
      }),
      basePath: "/api/customer-auth",
      secret: process.env.BETTER_AUTH_SECRET || "default_customer_auth_secret_32_chars",
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret",
        },
      },
      databaseHooks: {
        user: {
          create: {
            after: async (user) => {
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
