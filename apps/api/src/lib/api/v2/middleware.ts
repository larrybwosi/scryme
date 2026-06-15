export const v2Middleware = (req: any, res: any, next: any) => next();

export async function issueV2Token(
  clientId: string,
  clientSecret: string,
): Promise<any> {
  return {token: "stub"};
}
