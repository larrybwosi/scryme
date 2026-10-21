export interface PlatformModuleDefinition {
  key: string;
  name: string;
  description: string;
  category: "core" | "financial" | "mobile" | "operations" | "integrations";
  defaultEnabled: boolean;
}

export const PLATFORM_MODULES: PlatformModuleDefinition[] = [
  {
    key: "finance",
    name: "Finance & Accounting",
    description: "Ledgers, journal entries, expense tracking, and financial reports.",
    category: "financial",
    defaultEnabled: true,
  },
  {
    key: "android_app",
    name: "Android Mobile App Access",
    description: "Allows staff and drivers to authenticate and use the Android app.",
    category: "mobile",
    defaultEnabled: true,
  },
  {
    key: "bakery",
    name: "Bakery Production & Recipe Management",
    description: "Sub-recipes, baker's percentages, dough batching, and yield tracking.",
    category: "operations",
    defaultEnabled: true,
  },
  {
    key: "crm",
    name: "CRM & Customer Relationships",
    description: "Customer contacts, deals, activities, and marketing workflows.",
    category: "core",
    defaultEnabled: true,
  },
  {
    key: "pos",
    name: "Point of Sale (POS)",
    description: "Standalone and online POS terminals, cash drawers, and offline sales.",
    category: "operations",
    defaultEnabled: true,
  },
  {
    key: "services",
    name: "Service Bookings & Staff Scheduling",
    description: "Appointment bookings, staff shifts, capacity, and resource allocation.",
    category: "operations",
    defaultEnabled: true,
  },
  {
    key: "scryme",
    name: "Scryme Team Chat & Integrations",
    description: "Internal team communication, channel messaging, and bot notifications.",
    category: "integrations",
    defaultEnabled: true,
  },
  {
    key: "deliveries",
    name: "Deliveries & Fleet Management",
    description: "Driver dispatch, delivery partners, vehicle tracking, and POD reconciliation.",
    category: "operations",
    defaultEnabled: true,
  },
  {
    key: "ecommerce",
    name: "E-Commerce Connections",
    description: "Webstore sync, product mapping, order ingestion, and webhooks.",
    category: "integrations",
    defaultEnabled: true,
  },
];

export type PlatformModuleKey = (typeof PLATFORM_MODULES)[number]["key"];

export interface ModuleStatusMap {
  [moduleKey: string]: boolean;
}

export interface EffectiveModuleResolution {
  moduleKey: string;
  isEnabled: boolean;
  systemEnabled: boolean;
  orgEnabled: boolean;
  reason?: string;
}

export function evaluateModuleStatus(
  systemModules: ModuleStatusMap | null | undefined,
  orgModules: ModuleStatusMap | null | undefined,
  moduleKey: string,
): EffectiveModuleResolution {
  const definition = PLATFORM_MODULES.find((m) => m.key === moduleKey);
  const defaultState = definition ? definition.defaultEnabled : true;

  const systemEnabled = systemModules?.[moduleKey] !== false;
  const orgEnabled = orgModules?.[moduleKey] ?? defaultState;

  const isEnabled = systemEnabled && orgEnabled;

  let reason = "Module is active";
  if (!systemEnabled) {
    reason = "Disabled system-wide by platform administrator";
  } else if (!orgEnabled) {
    reason = "Disabled for this organization";
  }

  return {
    moduleKey,
    isEnabled,
    systemEnabled,
    orgEnabled,
    reason,
  };
}

export function evaluateAllModulesStatus(
  systemModules: ModuleStatusMap | null | undefined,
  orgModules: ModuleStatusMap | null | undefined,
): EffectiveModuleResolution[] {
  return PLATFORM_MODULES.map((moduleDef) =>
    evaluateModuleStatus(systemModules, orgModules, moduleDef.key),
  );
}
