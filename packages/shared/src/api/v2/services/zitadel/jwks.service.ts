import * as jose from 'jose';

export interface ZitadelJwtPayload extends jose.JWTPayload {
  sub: string;
  'urn:zitadel:iam:org:id'?: string;
  scope?: string;
}

export async function verifyZitadelJwt(
  token: string,
  redis: any,
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
