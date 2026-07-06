import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "../src/app.module";
import { V3Module, V3_SUB_MODULES } from "../src/v3/v3.module";
import * as fs from "fs";
import * as path from "path";

// Mock server-only before anything else
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mock = require("mock-require");
mock("server-only", {});

async function generateSpec() {
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

  const outputPath = path.resolve(process.cwd(), "v3-spec.json");
  fs.writeFileSync(outputPath, JSON.stringify(documentV3, null, 2));

  console.log(`OpenAPI V3 specification exported to ${outputPath}`);
  process.exit(0);
}

generateSpec().catch((err) => {
  console.error(err);
  process.exit(1);
});
