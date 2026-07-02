import { NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";

export async function POST(req: Request) {
  // 1. Authenticate the request
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: If checkPermission handled Role validation (e.g. OWNER, ADMIN, MANAGER),
  // make sure to enforce it here using your `auth` object roles if applicable.
  // if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.role)) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    // 2. Parse the incoming multi-part form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Dynamic imports for shared storage and utility utilities
    const { storageService, StorageCoreService } =
      await import("@repo/shared/storage");
    const { v7: uuidv7 } = await import("uuid");

    // 4. Generate unique storage file name
    const fileName = StorageCoreService.generateStorageFileName(
      file.name,
      uuidv7(),
    );

    // 5. Convert file to buffer and stream upload to your service
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await storageService.upload(buffer, fileName, file.type, {
      organizationId: auth.organizationId,
    });

    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    // 6. Save metadata record to DB
    const attachment = await db.attachment.create({
      data: {
        id: fileName,
        fileName: file.name,
        fileUrl: result.url,
        shortCode,
        shortUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        organizationId: auth.organizationId,
        memberId: auth.memberId,
      },
    });

    // 7. Return the structured response payload
    return NextResponse.json({
      success: true,
      data: {
        id: attachment.id,
        fileName: attachment.fileName || "file",
        url: attachment.shortUrl || attachment.fileUrl || "",
        fileUrl: attachment.shortUrl || attachment.fileUrl || "",
        shortUrl: attachment.shortUrl || "",
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes || 0,
      },
    });
  } catch (error: any) {
    console.error("Direct upload route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
