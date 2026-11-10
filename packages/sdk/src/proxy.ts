import { getScrymeV3API as originalGetScrymeV3API } from "./generated/scryme";
import type { AxiosInstance } from "axios";
import { methodsWithOrgSlugSet } from "./base";

function getEnvOrgSlug(): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    const slug = process.env.SCRYME_ORG_SLUG || process.env.NEXT_PUBLIC_SCRYME_ORG_SLUG;
    if (slug) return slug;
  }
  try {
    const getMeta = new Function("return typeof import.meta !== 'undefined' ? import.meta : undefined");
    const meta = getMeta();
    if (meta && meta.env) {
      const slug = meta.env.VITE_SCRYME_ORG_SLUG || meta.env.SCRYME_ORG_SLUG;
      if (slug) return slug;
    }
  } catch (e) {}
  return undefined;
}

/**
 * Minification-safe arity map for generated Orval methods that expect orgSlug.
 * Maps method names to the minimum expected string parameters before options/dto/body.
 * This guarantees reliable argument routing even when code is compressed/minified.
 */
const METHOD_STRING_ARITY: Record<string, number> = {
  // Methods expecting orgSlug + 1 string identifier
  catalogGetProduct: 2,
  catalogUpdateProduct: 2,
  catalogCreateReview: 2,
  catalogUpdateReview: 2,
  catalogDeleteReview: 2,
  servicesGetService: 2,
  servicesUpdateService: 2,
  servicesDeleteService: 2,
  servicesUpdateCategory: 2,
  servicesDeleteCategory: 2,
  servicesUpdateResource: 2,
  servicesDeleteResource: 2,
  servicesGetBooking: 2,
  servicesUpdateBookingStatus: 2,
  servicesCompleteBooking: 2,
  servicesCancelBookingSeries: 2,
  servicesGetAvailability: 2,
  publicServicesGetService: 2,
  publicServicesGetAvailability: 2,
  customersGetCustomerById: 2,
  customersUpdate: 2,
  customersDelete: 2,
  customersGetAddresses: 2,
  customersAddAddress: 2,
  customersRevokeSession: 2,
  crmControllerGetRecord: 2,
  crmControllerUpdateRecord: 2,
  crmControllerCreateNote: 2,
  crmControllerGetRecordNotes: 2,
  crmControllerGetTimeline: 2,
  stockingGetPartner: 2,
  stockingUpdatePartner: 2,
  // Methods with orgSlug + 2 string parameters
  catalogUpdateSupplierVariant: 3,
};

function getStringParamCountForMethod(methodName: string): number {
  if (methodName in METHOD_STRING_ARITY) {
    return METHOD_STRING_ARITY[methodName];
  }
  // Default for methods in methodsWithOrgSlugSet is 1 (orgSlug itself)
  return methodsWithOrgSlugSet.has(methodName) ? 1 : 0;
}

export const getScrymeV3API = (axiosInstance?: AxiosInstance, defaultOrgSlug?: string) => {
  const api = originalGetScrymeV3API(axiosInstance);

  return new Proxy(api, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);
      if (typeof originalValue === "function") {
        const methodName = String(prop);
        if (methodsWithOrgSlugSet.has(methodName)) {
          return function (this: any, ...args: any[]) {
            const stringParamsExpected = getStringParamCountForMethod(methodName);
            const stringArgsPassed = args.filter((arg) => typeof arg === "string").length;

            // If the caller passed fewer string arguments than expected, they omitted orgSlug
            if (stringArgsPassed < stringParamsExpected) {
              const envSlug = defaultOrgSlug || getEnvOrgSlug() || "default-org";
              return originalValue.apply(this, [envSlug, ...args]);
            }
            return originalValue.apply(this, args);
          };
        }
      }
      return originalValue;
    },
  });
};
