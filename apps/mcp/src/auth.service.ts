import { Injectable, Logger } from "@nestjs/common";
import axios, { type AxiosResponse } from "axios";
import { getScrymeV3API } from "@scryme/sdk";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;
  public readonly v3 = getScrymeV3API(axios as any);

  async ensureAuthenticated(orgSlug?: string): Promise<string> {
    const clientId = process.env.SCRYME_CLIENT_ID;
    const clientSecret = process.env.SCRYME_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing SCRYME_CLIENT_ID or SCRYME_CLIENT_SECRET environment variables. " +
        "Please configure these credentials so that the MCP server can authenticate with the V3 API."
      );
    }

    const now = Date.now();
    if (!this.cachedToken || now >= this.tokenExpiresAt - 300 * 1000) {
      this.logger.log("Exchanging client credentials for a new V3 access token...");
      try {
        const apiBaseUrl = process.env.SCRYME_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";
        axios.defaults.baseURL = apiBaseUrl;

        const response = await this.v3.authExchangeToken(
          { clientId, clientSecret },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.data && response.data.data && response.data.data.access_token) {
          this.cachedToken = response.data.data.access_token;
          const expiresIn = response.data.data.expires_in || 3600;
          this.tokenExpiresAt = Date.now() + expiresIn * 1000;
          this.logger.log("Successfully obtained new V3 access token.");
        } else {
          throw new Error("Invalid response format from token exchange endpoint.");
        }
      } catch (error: any) {
        this.logger.error(`Error exchanging client credentials: ${error.message || error}`);
        throw error;
      }
    }

    axios.defaults.baseURL = process.env.SCRYME_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";
    axios.defaults.headers.common["Authorization"] = `Bearer ${this.cachedToken}`;
    if (orgSlug) {
      axios.defaults.headers.common["x-org-slug"] = orgSlug;
    } else {
      delete axios.defaults.headers.common["x-org-slug"];
    }

    return this.cachedToken;
  }

  async callSdk<T>(
    orgSlug: string,
    fn: (config?: any) => Promise<AxiosResponse<T>>,
    additionalConfig: any = {}
  ): Promise<any> {
    await this.ensureAuthenticated(orgSlug);
    try {
      const config = {
        ...additionalConfig,
        headers: {
          ...additionalConfig?.headers,
          Authorization: `Bearer ${this.cachedToken}`,
          "x-org-slug": orgSlug,
        },
      };
      const response = await fn(config);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      const errorPayload = error.response?.data || error.message || error;
      this.logger.error(`Scryme V3 API Call Error: ${JSON.stringify(errorPayload)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error calling V3 API: ${JSON.stringify(errorPayload, null, 2)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
