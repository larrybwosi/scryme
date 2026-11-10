import { sanitizeSensitiveData } from "./security";

/**
 * Pluggable Logger Interface with Sensitive Data Redaction
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export const consoleLogger: Logger = {
  debug: (msg, ...args) => console.debug(`[scryme-sdk] ${msg}`, ...args.map(a => sanitizeSensitiveData(a))),
  info: (msg, ...args) => console.info(`[scryme-sdk] ${msg}`, ...args.map(a => sanitizeSensitiveData(a))),
  warn: (msg, ...args) => console.warn(`[scryme-sdk] ${msg}`, ...args.map(a => sanitizeSensitiveData(a))),
  error: (msg, ...args) => console.error(`[scryme-sdk] ${msg}`, ...args.map(a => sanitizeSensitiveData(a))),
};
