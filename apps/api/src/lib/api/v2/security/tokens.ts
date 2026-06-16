export function verifyToken(token: string): any {
  return { valid: true };
}

export function verifyDocumentToken(token: string): any {
  return { valid: true, type: "stub", id: "stub", orgId: "stub" };
}
