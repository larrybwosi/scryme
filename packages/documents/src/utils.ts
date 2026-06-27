import { BrandingOptions, CurrencySettings } from "./types";

/**
 * Resolves branding options based on a hierarchy of configurations.
 */
export function resolveBranding(
  organization: any,
  config: any = {},
): BrandingOptions {
  const showLogo = config?.showLogo ?? true;
  const logoUrl = showLogo ? config.logoUrl || organization?.logo : null;

  return {
    companyName: config.companyName || organization?.name || "Organization",
    companyAddress:
      config.companyAddress || formatAddress(organization?.address),
    companyPhone: config.companyPhone || organization?.phone,
    companyEmail: config.companyEmail || organization?.email,
    companyWebsite: config.companyWebsite || organization?.website || "",
    companyTagline: config.companyTagline || organization?.description || "",
    logoUrl,
    showLogo,
    primaryColor:
      config.primaryColor || organization?.primaryColor || "#2563eb",
    showPoweredBy: config.showPoweredBy ?? true,
    watermarkText: config.watermarkText,
    customFields: config.customFields,
  };
}

/**
 * Resolves currency settings based on transaction and organization defaults.
 */
export function resolveCurrencySettings(
  transaction: any,
  organization: any,
): CurrencySettings {
  const defaultCurrency = organization?.settings?.defaultCurrency || "USD";
  const defaultLocale =
    organization?.settings?.defaultTimezone === "Africa/Nairobi"
      ? "en-KE"
      : "en-US";

  const code =
    transaction?.currencyCode || transaction?.currency || defaultCurrency;

  // Mapping some common symbols
  const symbolMap: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
  };

  return {
    code,
    symbol: symbolMap[code] || code,
    locale: defaultLocale,
    precision: 2,
  };
}

/**
 * Formats a numeric value as a currency string.
 */
export function formatCurrency(
  amount: number,
  settings: CurrencySettings,
): string {
  try {
    return new Intl.NumberFormat(settings.locale || "en-US", {
      style: "currency",
      currency: settings.code,
      minimumFractionDigits: settings.precision ?? 2,
    }).format(amount);
  } catch (e) {
    return `${settings.symbol || settings.code} ${amount.toFixed(settings.precision ?? 2)}`;
  }
}

/**
 * Format address object or string to a string.
 */
export function formatAddress(input: any): string {
  if (!input) return "";
  if (typeof input === "string") return input;

  const target =
    input.address && typeof input.address === "object" ? input.address : input;
  const data = typeof target === "object" ? target : input;

  if (!data || typeof data !== "object") return String(input);

  const parts = [
    data.street,
    data.street1,
    data.street2,
    data.line1,
    data.city,
    data.state,
    data.zipCode,
    data.postalCode,
    data.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "";
}
