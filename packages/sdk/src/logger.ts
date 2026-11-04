/**
 * Pluggable Logger Interface
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
  debug: (msg, ...args) => console.debug(`[scryme-sdk] ${msg}`, ...args),
  info: (msg, ...args) => console.info(`[scryme-sdk] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[scryme-sdk] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[scryme-sdk] ${msg}`, ...args),
};
