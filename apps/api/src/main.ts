import { env } from "@repo/env";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { AppModule } from "./app.module";
import { validateEncryptionKey } from "@repo/shared/api/v2/utils/encryption";
import { V2Module, V2_SUB_MODULES } from "./v2/v2.module";
import { V3Module, V3_SUB_MODULES } from "./v3/v3.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { StandardResponseInterceptor } from "./common/interceptors/standard-response.interceptor";
import { redactSensitiveData } from "./common/utils/redaction";

async function bootstrap() {
  // Verify encryption key at startup
  validateEncryptionKey();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Request logging for debugging
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onRequest", (request, reply, done) => {
      const startTime = Date.now();
      const { method, url, headers, body, query } = request;

      // Log incoming request
      console.log({
        timestamp: new Date().toISOString(),
        type: "INCOMING_REQUEST",
        method,
        url,
        headers: {
          "user-agent": headers["user-agent"],
          "content-type": headers["content-type"],
          "x-api-key": headers["x-api-key"] ? "[REDACTED]" : undefined,
          "x-member-token": headers["x-member-token"]
            ? "[REDACTED]"
            : undefined,
          authorization: headers.authorization ? "[REDACTED]" : undefined,
        },
        query: Object.keys(query || {}).length
          ? redactSensitiveData(query)
          : undefined,
        body:
          body && Object.keys(body).length
            ? redactSensitiveData(body)
            : undefined,
      });

      // Log response when request completes
      reply.raw.on("finish", () => {
        const duration = Date.now() - startTime;
        console.log({
          timestamp: new Date().toISOString(),
          type: "REQUEST_COMPLETED",
          method,
          url,
          statusCode: reply.statusCode,
          duration: `${duration}ms`,
        });
      });

      done();
    });

  // Middlewares & Plugins
  await app.register(fastifyCookie as any);
  await app.register(fastifyMultipart as any);

  // Global Configuration
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new StandardResponseInterceptor());

  // Swagger V2
  const configV2 = new DocumentBuilder()
    .setTitle("Scryme V2 API")
    .setDescription("The Scryme V2 API documentation")
    .setVersion("2.0")
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "x-api-key")
    .addApiKey(
      { type: "apiKey", name: "x-member-token", in: "header" },
      "x-member-token",
    )
    .addBearerAuth()
    .build();
  const documentV2 = SwaggerModule.createDocument(app, configV2, {
    include: [V2Module, ...V2_SUB_MODULES],
  });
  SwaggerModule.setup("api/v2/docs", app, documentV2);

  // Swagger V3
  const configV3 = new DocumentBuilder()
    .setTitle("Scryme V3 API")
    .setDescription(
      "The Scryme V3 API documentation - Scalable & Enterprise Ready",
    )
    .setVersion("3.0")
    .addBearerAuth()
    .build();
  const documentV3 = SwaggerModule.createDocument(app, configV3, {
    include: [V3Module, ...V3_SUB_MODULES],
  });
  SwaggerModule.setup("api/v3/docs", app, documentV3);

  // Serve landing page at /
  app
    .getHttpAdapter()
    .getInstance()
    .get("/", async (_req, reply) => {
      reply.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scryme API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; font-weight: 800; color: #38bdf8; }
    p { margin-top: 1rem; font-size: 1.125rem; color: #94a3b8; }
    .links { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .links a {
      padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none;
      font-weight: 600; transition: background 0.2s;
    }
    .links a:first-child { background: #38bdf8; color: #0f172a; }
    .links a:first-child:hover { background: #7dd3fc; }
    .links a:last-child { background: #1e293b; color: #e2e8f0; }
    .links a:last-child:hover { background: #334155; }
    .status { margin-top: 2rem; font-size: 0.875rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Scryme API</h1>
    <p>Welcome to the Scryme API service.</p>
    <div class="links">
      <a href="/api/v2/docs">V2 API Docs</a>
      <a href="/api/v3/docs">V3 API Docs</a>
    </div>
    <div class="status">Scryme API &middot; Running</div>
  </div>
</body>
</html>`);
    });

  await app.listen(env.PORT, "0.0.0.0");
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
