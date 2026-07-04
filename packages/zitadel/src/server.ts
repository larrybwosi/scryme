import * as jose from 'jose';

export interface ZitadelJwtPayload extends jose.JWTPayload {
  sub: string;
  'urn:zitadel:iam:org:id'?: string;
  scope?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export async function verifyZitadelJwt(
  token: string,
  domain: string,
  audience: string,
): Promise<ZitadelJwtPayload> {
  const issuer = `https://${domain}`;
  const jwksUri = `https://${domain}/oauth/v2/keys`;

  const res = await fetch(jwksUri);
  const { keys } = await res.json();
  const keyStore = jose.createLocalJWKSet({ keys });

  const { payload } = await jose.jwtVerify(token, keyStore, { audience, issuer });
  return payload as ZitadelJwtPayload;
}

export class ZitadelService {
  constructor() {}

  async getUser(zitadelUserId: string) {
    // This is a placeholder for actual Zitadel API call
    // In a real scenario, this would use a service user to fetch user details
    // For now, we return a mock or implement as needed
    console.log(`Fetching user ${zitadelUserId} from Zitadel`);
    return { id: zitadelUserId };
  }
}
