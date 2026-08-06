import axios, { AxiosInstance } from "axios";
import { getScrymeV3API } from "./index";
import type { RegisterCustomerDto } from "./generated/model/registerCustomerDto";

export interface ServerSDKConfig {
  baseURL?: string;
  orgSlug?: string;
  token?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
}

export function createServerSDK(config: ServerSDKConfig = {}) {
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: config.baseURL || "https://api.scryme.tech",
  });

  // Attach token or apiKey if present
  if (config.token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${config.token}`;
  }

  if (config.apiKey) {
    axiosInstance.defaults.headers.common["x-api-key"] = config.apiKey;
  }

  const api = getScrymeV3API(axiosInstance, config.orgSlug);

  const auth = {
    signUp: async (orgSlug: string, dto: RegisterCustomerDto) => {
      return api.customersRegister(orgSlug, dto);
    },

    authenticate: async () => {
      if (!config.clientId || !config.clientSecret) {
        throw new Error("clientId and clientSecret must be configured to authenticate");
      }
      const response = await api.authExchangeToken({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });
      const tokenData = response.data?.data;
      const accessToken = tokenData?.access_token;
      if (accessToken) {
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      }
      return response.data;
    },

    signIn: async (credentials: { email: string; password?: string }) => {
      const response = await axiosInstance.post("/auth/sign-in/email", credentials);
      return response.data;
    },
  };

  return {
    api,
    auth,
    axiosInstance,
  };
}
