import { Module } from "@nestjs/common";
import { DocumentModule } from "@/common/documents/document.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { DocumentsController, PublicDocumentsController } from "./interfaces/http/documents.controller";
import { DocumentsUseCase } from "./application/documents.use-case";

@Module({
  imports: [DocumentModule, PrismaModule],
  controllers: [DocumentsController, PublicDocumentsController],
  providers: [DocumentsUseCase],
  exports: [DocumentsUseCase],
})
export class DocumentsModule {}
