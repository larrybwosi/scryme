import { SetMetadata } from "@nestjs/common";
import { PlatformModuleKey } from "@repo/shared/constants";

export const REQUIRE_MODULE_KEY = "require_module";

/**
 * Decorator to enforce that a specific platform module (e.g. 'finance', 'android_app', 'bakery')
 * is enabled both system-wide and for the tenant organization.
 */
export const RequireModule = (moduleKey: PlatformModuleKey) =>
  SetMetadata(REQUIRE_MODULE_KEY, moduleKey);
