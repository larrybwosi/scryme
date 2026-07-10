import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { V3Module, V3_SUB_MODULES } from "./v3/v3.module";
import * as fs from "fs";
import * as path from "path";

async function generate() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

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

  const outputPath = path.resolve(process.cwd(), "../../packages/v3-sdk/openapi.json");

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(documentV3, null, 2));
  console.log(`Swagger JSON generated at ${outputPath}`);

  await app.close();
  process.exit(0);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
