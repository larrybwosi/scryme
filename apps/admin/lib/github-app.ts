import crypto from "crypto";

export interface GitHubAppConfig {
  appId?: string;
  appSlug?: string;
  clientId?: string;
  clientSecret?: string;
  privateKey?: string;
  webhookSecret?: string;
  installationId?: string;
  owner?: string;
  repo?: string;
  token?: string;
}

/**
 * Creates a GitHub App JWT valid for 10 minutes, signed with RS256 using the GitHub App Private Key.
 */
export function generateGitHubAppJwt(appId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued 60s in the past to account for clock drift
    exp: now + 10 * 60, // Expires in 10 minutes
    iss: appId,
  };

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const encodeBase64Url = (objOrStr: any): string => {
    const json = typeof objOrStr === "string" ? objOrStr : JSON.stringify(objOrStr);
    return Buffer.from(json)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const encodedHeader = encodeBase64Url(header);
  const encodedPayload = encodeBase64Url(payload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(dataToSign);
  const signature = signer.sign(privateKeyPem, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${dataToSign}.${signature}`;
}

/**
 * Gets an installation access token for a given installation ID using GitHub App credentials.
 */
export async function getInstallationAccessToken(
  appId: string,
  privateKey: string,
  installationId: string,
): Promise<{ token: string; expires_at: string }> {
  const jwt = generateGitHubAppJwt(appId, privateKey);
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "Scryme-Admin-App",
      },
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create installation token (${res.status})`);
  }

  return res.json();
}
