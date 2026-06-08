import { NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";

export async function POST(req: Request) {
  const auth = await getServerAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  try {
    const formData = await req.formData();

    // Forward headers including cookies for authentication
    // We omit 'content-type' to let fetch generate the correct boundary for multipart/form-data
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-type") {
        headers[key] = value;
      }
    });

    const response = await fetch(`${apiUrl}/api/upload`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "Failed to upload to API", details: error },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy upload error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
