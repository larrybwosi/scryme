import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { V3Module } from './v3/v3.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { StandardResponseInterceptor } from './common/interceptors/standard-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // Middlewares & Plugins
  await app.register(fastifyCookie as any);
  await app.register(fastifyMultipart as any);

  // Global Configuration
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new StandardResponseInterceptor());

  // Swagger V2
  const configV2 = new DocumentBuilder()
    .setTitle('Dealio V2 API')
    .setDescription('The Dealio V2 API documentation')
    .setVersion('2.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addApiKey({ type: 'apiKey', name: 'x-member-token', in: 'header' }, 'x-member-token')
    .addBearerAuth()
    .build();
  const documentV2 = SwaggerModule.createDocument(app, configV2, {
    include: [AppModule], // This might need refinement to exclude V3
  });
  SwaggerModule.setup('api/v2/docs', app, documentV2);

  // Swagger V3
  const configV3 = new DocumentBuilder()
    .setTitle('Dealio V3 API')
    .setDescription('The Dealio V3 API documentation - Scalable & Enterprise Ready')
    .setVersion('3.0')
    .addBearerAuth()
    .build();
  const documentV3 = SwaggerModule.createDocument(app, configV3, {
    include: [V3Module],
  });
  SwaggerModule.setup('api/v3/docs', app, documentV3);

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
