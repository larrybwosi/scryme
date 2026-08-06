import { getScrymeV3API as originalGetScrymeV3API } from "./generated/scryme";
import type { AxiosInstance } from "axios";

export * from "./generated/scryme";
export * from "./generated/model/index";

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

function expectsOrgSlug(fn: Function): boolean {
  const fnStr = fn.toString();
  const match = fnStr.match(/^\s*(?:async\s+)?\(([^)]+)\)/);
  if (!match) {
    const singleMatch = fnStr.match(/^\s*(\w+)\s*=>/);
    return singleMatch ? singleMatch[1] === "orgSlug" : false;
  }
  const firstParam = match[1].split(",")[0].split(":")[0].trim();
  return firstParam === "orgSlug";
}

function getStringParamCount(fn: Function): number {
  const fnStr = fn.toString();
  const match = fnStr.match(/^\s*(?:async\s+)?\(([^)]+)\)/);
  if (!match) return 0;
  const params = match[1].split(",").map(p => p.trim());
  let count = 0;
  for (const param of params) {
    const cleanParam = param.split(":")[0].split("=")[0].trim();
    const lower = cleanParam.toLowerCase();
    if (
      lower === "params" ||
      lower === "options" ||
      lower.endsWith("dto") ||
      lower.endsWith("body") ||
      lower.endsWith("payload")
    ) {
      break;
    }
    count++;
  }
  return count;
}

export const getScrymeV3API = (axiosInstance?: AxiosInstance) => {
  const api = originalGetScrymeV3API(axiosInstance);

  return new Proxy(api, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);
      if (typeof originalValue === "function") {
        if (expectsOrgSlug(originalValue)) {
          return function (this: any, ...args: any[]) {
            const stringParamsExpected = getStringParamCount(originalValue);
            const stringArgsPassed = args.filter(arg => typeof arg === "string").length;

            // If the caller passed fewer string arguments than expected, they omitted orgSlug
            if (stringArgsPassed < stringParamsExpected) {
              const envSlug = getEnvOrgSlug() || "default-org";
              return originalValue.apply(this, [envSlug, ...args]);
            }
            return originalValue.apply(this, args);
          };
        }
      }
      return originalValue;
    }
  });
};

export * from "./client";
export * from "./server";
