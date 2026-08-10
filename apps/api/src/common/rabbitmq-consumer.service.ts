import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import amqp from "amqplib";

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initRabbitMQ();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (e) {
      this.logger.error("Failed to safely teardown RabbitMQ connection", e);
    }
  }

  private async initRabbitMQ() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Ensure exchange exists
      await this.channel.assertExchange("customer-auth-exchange", "topic", {
        durable: true,
      });

      // Declare queue and bind topic routing key
      const queueName = "main-api-customer-registrations";
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(
        queueName,
        "customer-auth-exchange",
        "customer.registered"
      );

      this.logger.log(`RabbitMQ consumer connected and bound queue "${queueName}" to customer.registered`);

      // Consume messages
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          this.logger.log(`Received RabbitMQ event "customer.registered": ${JSON.stringify(payload)}`);

          await this.syncCustomerWithMainDB(payload);

          this.channel?.ack(msg);
        } catch (err: any) {
          this.logger.error(`Error processing RabbitMQ message: ${err.message}`, err.stack);
          // Nack message and requeue so it doesn't get lost
          this.channel?.nack(msg, false, true);
        }
      });
    } catch (error: any) {
      this.logger.warn(`RabbitMQ connection/setup failed: ${error.message}. Running in polling/standalone fallback.`);
    }
  }

  private async syncCustomerWithMainDB(payload: { id: string; email: string; name?: string }) {
    // Determine the default/first organization to hook this registered customer into
    const firstOrg = await this.prisma.client.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!firstOrg) {
      this.logger.warn("No active organization found to bind newly registered customer.");
      return;
    }

    const orgId = firstOrg.id;
    const email = payload.email;
    const name = payload.name || email.split("@")[0] || "Registered Customer";

    await this.prisma.client.$transaction(async (tx) => {
      // Find or create Customer profile matching this email
      let customer = await tx.customer.findUnique({
        where: {
          organizationId_email: {
            organizationId: orgId,
            email,
          },
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name,
            email,
            organizationId: orgId,
            creationType: "SELF_REGISTERED",
          },
        });
        this.logger.log(`Created new Customer record in main ERP DB: ${customer.id}`);
      }

      // Ensure external mapping links this customer profile to our new Better Auth id
      await tx.externalMapping.upsert({
        where: {
          organizationId_provider_externalId_entityType: {
            organizationId: orgId,
            provider: "BETTER_AUTH",
            externalId: payload.id,
            entityType: "CUSTOMER",
          },
        },
        create: {
          organizationId: orgId,
          internalId: customer.id,
          externalId: payload.id,
          provider: "BETTER_AUTH",
          entityType: "CUSTOMER",
          internalEntityType: "Customer",
        },
        update: {
          internalId: customer.id,
        },
      });

      // Find or create corresponding User record in ERP DB for cross-app membership alignment
      const linkedUser = await tx.user.upsert({
        where: { email },
        create: {
          id: payload.id,
          name,
          email,
          role: "CLIENT",
          activeOrganizationId: orgId,
        },
        update: {
          activeOrganizationId: orgId,
        },
      });

      this.logger.log(`Successfully mapped customer registration to user: ${linkedUser.id} / customer: ${customer.id}`);
    });
  }
}
