import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export interface StrapiClientConfig {
  strapiUrl: string;
  apiToken: string;
  graphqlPath?: string;
  /** Optional timeout in ms (default 15 000) */
  timeoutMs?: number;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface StrapiEntry<TAttributes = Record<string, unknown>> {
  id: number;
  attributes: TAttributes;
}

export interface StrapiProductAttributes {
  name: string;
  slug: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  active?: boolean;
  publishedAt?: string | null;
  images?: { data: StrapiEntry<{ url: string; formats?: Record<string, { url: string }> }>[] };
  categories?: { data: StrapiEntry<{ name: string; slug: string }>[] };
  variants?: { data: StrapiEntry<StrapiVariantAttributes>[] };
  locationStock?: Record<string, number>; // { "loc_id": qty }
}

export interface StrapiVariantAttributes {
  name: string;
  sku: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, string>; // { "color": "red", "size": "M" }
}

export interface StrapiCustomerAttributes {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizationSlug?: string; // tenant identifier
  externalId?: string; // mapped Scryme Customer ID
  blocked?: boolean;
  publishedAt?: string | null;
}

/**
 * StrapiV4Provider
 *
 * Thin, typed Axios wrapper around the Strapi v4 REST and GraphQL APIs.
 * Each method accepts a `StrapiClientConfig` so a single provider instance
 * can serve multiple organisation connections at runtime.
 */
@Injectable()
export class StrapiV4Provider {
  private readonly logger = new Logger(StrapiV4Provider.name);
  private readonly DEFAULT_TIMEOUT = 15_000;
  private readonly MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10 MB

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  private buildClient(cfg: StrapiClientConfig): AxiosInstance {
    return axios.create({
      baseURL: cfg.strapiUrl.replace(/\/$/, ""),
      timeout: cfg.timeoutMs ?? this.DEFAULT_TIMEOUT,
      maxContentLength: this.MAX_RESPONSE_SIZE,
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  private async request<T>(
    cfg: StrapiClientConfig,
    options: AxiosRequestConfig,
  ): Promise<T> {
    const client = this.buildClient(cfg);
    const response = await client.request<T>(options);
    return response.data;
  }

  // -----------------------------------------------------------------
  // Server info
  // -----------------------------------------------------------------

  /**
   * Returns Strapi server version information from /api/.
   * Useful for verifying credentials on connection creation.
   */
  async ping(cfg: StrapiClientConfig): Promise<{ strapiVersion: string }> {
    const data = await this.request<{ data: { strapiVersion: string } }>(cfg, {
      method: "GET",
      url: "/api/",
    });
    return { strapiVersion: data?.data?.strapiVersion ?? "unknown" };
  }

  // -----------------------------------------------------------------
  // Products
  // -----------------------------------------------------------------

  async getProducts(
    cfg: StrapiClientConfig,
    options: {
      page?: number;
      pageSize?: number;
      populate?: string | string[];
      filters?: Record<string, unknown>;
    } = {},
  ): Promise<StrapiListResponse<StrapiEntry<StrapiProductAttributes>>> {
    const params: Record<string, unknown> = {
      "pagination[page]": options.page ?? 1,
      "pagination[pageSize]": options.pageSize ?? 100,
    };

    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach((p, i) => {
          params[`populate[${i}]`] = p;
        });
      } else {
        params["populate"] = options.populate;
      }
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, val]) => {
        params[`filters[${key}]`] = val;
      });
    }

    return this.request(cfg, {
      method: "GET",
      url: "/api/products",
      params,
    });
  }

  async getProduct(
    cfg: StrapiClientConfig,
    id: number,
    populate = "*",
  ): Promise<StrapiSingleResponse<StrapiEntry<StrapiProductAttributes>>> {
    return this.request(cfg, {
      method: "GET",
      url: `/api/products/${id}`,
      params: { populate },
    });
  }

  async createProduct(
    cfg: StrapiClientConfig,
    data: Partial<StrapiProductAttributes>,
  ): Promise<StrapiSingleResponse<StrapiEntry<StrapiProductAttributes>>> {
    return this.request(cfg, {
      method: "POST",
      url: "/api/products",
      data: { data },
    });
  }

  async updateProduct(
    cfg: StrapiClientConfig,
    id: number,
    data: Partial<StrapiProductAttributes>,
  ): Promise<StrapiSingleResponse<StrapiEntry<StrapiProductAttributes>>> {
    return this.request(cfg, {
      method: "PUT",
      url: `/api/products/${id}`,
      data: { data },
    });
  }

  async deleteProduct(
    cfg: StrapiClientConfig,
    id: number,
  ): Promise<StrapiSingleResponse<StrapiEntry<StrapiProductAttributes>>> {
    return this.request(cfg, {
      method: "DELETE",
      url: `/api/products/${id}`,
    });
  }

  // -----------------------------------------------------------------
  // Customers
  // -----------------------------------------------------------------

  async getCustomers(
    cfg: StrapiClientConfig,
    options: { page?: number; pageSize?: number; filters?: Record<string, unknown> } = {},
  ): Promise<StrapiListResponse<StrapiEntry<StrapiCustomerAttributes>>> {
    const params: Record<string, unknown> = {
      "pagination[page]": options.page ?? 1,
      "pagination[pageSize]": options.pageSize ?? 100,
    };

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, val]) => {
        params[`filters[${key}]`] = val;
      });
    }

    return this.request(cfg, {
      method: "GET",
      url: "/api/customers",
      params,
    });
  }

  async getCustomerByEmail(
    cfg: StrapiClientConfig,
    email: string,
  ): Promise<StrapiEntry<StrapiCustomerAttributes> | null> {
    const res = await this.getCustomers(cfg, {
      filters: { "email[$eq]": email },
      pageSize: 1,
    });
    return res.data?.[0] ?? null;
  }

  async createCustomer(
    cfg: StrapiClientConfig,
    data: Partial<StrapiCustomerAttributes>,
  ): Promise<StrapiSingleResponse<StrapiEntry<StrapiCustomerAttributes>>> {
    return this.request(cfg, {
      method: "POST",
      url: "/api/customers",
      data: { data },
    });
  }

  async updateCustomer(
    cfg: StrapiClientConfig,
    id: number,
    data: Partial<StrapiCustomerAttributes>,
  ): Promise<StrapiSingleResponse<StrapiEntry<StrapiCustomerAttributes>>> {
    return this.request(cfg, {
      method: "PUT",
      url: `/api/customers/${id}`,
      data: { data },
    });
  }

  // -----------------------------------------------------------------
  // Generic content-type access (for custom types)
  // -----------------------------------------------------------------

  async listEntries<T = Record<string, unknown>>(
    cfg: StrapiClientConfig,
    contentType: string,
    params?: Record<string, unknown>,
  ): Promise<StrapiListResponse<StrapiEntry<T>>> {
    return this.request(cfg, {
      method: "GET",
      url: `/api/${contentType}`,
      params: {
        "pagination[pageSize]": 100,
        populate: "*",
        ...params,
      },
    });
  }

  async getEntry<T = Record<string, unknown>>(
    cfg: StrapiClientConfig,
    contentType: string,
    id: number,
  ): Promise<StrapiSingleResponse<StrapiEntry<T>>> {
    return this.request(cfg, {
      method: "GET",
      url: `/api/${contentType}/${id}`,
      params: { populate: "*" },
    });
  }

  async upsertEntry<T = Record<string, unknown>>(
    cfg: StrapiClientConfig,
    contentType: string,
    externalId: number | null,
    data: Partial<T>,
  ): Promise<StrapiSingleResponse<StrapiEntry<T>>> {
    if (externalId) {
      return this.request(cfg, {
        method: "PUT",
        url: `/api/${contentType}/${externalId}`,
        data: { data },
      });
    }
    return this.request(cfg, {
      method: "POST",
      url: `/api/${contentType}`,
      data: { data },
    });
  }

  // -----------------------------------------------------------------
  // GraphQL
  // -----------------------------------------------------------------

  async graphql<T = unknown>(
    cfg: StrapiClientConfig,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const path = cfg.graphqlPath ?? "/graphql";
    const res = await this.request<{ data: T; errors?: unknown[] }>(cfg, {
      method: "POST",
      url: path,
      data: { query, variables },
    });

    if ((res as any).errors?.length) {
      this.logger.warn("Strapi GraphQL errors", (res as any).errors);
    }

    return (res as any).data as T;
  }

  // -----------------------------------------------------------------
  // Inventory / Stock push helpers
  // -----------------------------------------------------------------

  /**
   * Pushes multi-location stock data into a Strapi product entry.
   * Expects the Strapi product type to have a `locationStock` JSON field.
   */
  async pushStockToStrapi(
    cfg: StrapiClientConfig,
    strapiProductId: number,
    locationStock: Record<string, number>,
  ): Promise<void> {
    await this.updateProduct(cfg, strapiProductId, {
      locationStock,
    } as Partial<StrapiProductAttributes>);
  }

  // -----------------------------------------------------------------
  // Webhook registration
  // -----------------------------------------------------------------

  /**
   * Lists all registered webhooks on the Strapi instance.
   * Requires admin credentials (not a regular API token).
   */
  async listWebhooks(
    cfg: StrapiClientConfig,
  ): Promise<{ id: number; name: string; url: string; events: string[] }[]> {
    const res = await this.request<{ data: { id: number; name: string; url: string; events: string[] }[] }>(cfg, {
      method: "GET",
      url: "/api/webhooks",
    });
    return (res as any)?.data ?? [];
  }

  async registerWebhook(
    cfg: StrapiClientConfig,
    name: string,
    url: string,
    events: string[],
  ): Promise<{ id: number }> {
    const res = await this.request<{ data: { id: number } }>(cfg, {
      method: "POST",
      url: "/api/webhooks",
      data: { data: { name, url, events, enabled: true } },
    });
    return { id: (res as any)?.data?.id };
  }
}
