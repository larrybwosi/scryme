import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { verifyDocumentToken } from "@repo/shared/server";

@Injectable()
export class PublicService {
  async getDocument(
    type: string,
    id: string,
    token: string,
    format: string,
    template?: string,
  ) {
    if (!token) {
      throw new UnauthorizedException("Token required");
    }

    const payload = verifyDocumentToken(token);

    if (!payload || payload.type !== type || payload.id !== id) {
      throw new ForbiddenException("Invalid or expired link");
    }

    try {
      const { getDocumentStream } =
        await import("@/lib/api/v2/services/documents");

      const result = await getDocumentStream(
        type as any,
        id,
        payload.orgId,
        (format?.toUpperCase() as any) || "A4",
        template,
      );

      return result;
    } catch (error) {
      if (error.message?.includes("not found")) {
        throw new NotFoundException("Document not found");
      }
      throw new InternalServerErrorException("Failed to generate document");
    }
  }
}
