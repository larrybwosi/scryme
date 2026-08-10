import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../prisma/generated-client";
import amqp from "amqplib";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 4001;

let rabbitChannel: amqp.Channel | null = null;

async function initRabbitMQ() {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    const connection = await amqp.connect(rabbitUrl);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertExchange("customer-auth-exchange", "topic", {
      durable: true,
    });
    console.log("RabbitMQ initialized successfully in Customer Auth Service.");
  } catch (error) {
    console.warn("Failed to connect to RabbitMQ, proceeding in fallback/retry mode:", error);
  }
}

async function publishEvent(routingKey: string, data: any) {
  if (rabbitChannel) {
    try {
      rabbitChannel.publish(
        "customer-auth-exchange",
        routingKey,
        Buffer.from(JSON.stringify(data))
      );
      console.log(`Published event ${routingKey} to RabbitMQ`);
    } catch (err) {
      console.error("Failed to publish RabbitMQ event:", err);
    }
  } else {
    console.log(`RabbitMQ offline. Simulation log event ${routingKey}:`, data);
  }
}

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
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
          await publishEvent("customer.registered", {
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

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.all("/api/auth/*", (req, res) => {
  return auth.handler(req, res);
});

app.get("/api/auth/session", async (req, res) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const session = await auth.api.getSession({
    headers,
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json(session);
});

app.listen(port, async () => {
  console.log(`Customer Auth Microservice listening on port ${port}`);
  await initRabbitMQ();
});
