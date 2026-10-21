import { describe, it, expect } from "vitest";
import {
  evaluateModuleStatus,
  evaluateAllModulesStatus,
  PLATFORM_MODULES,
} from "../modules";

describe("Module Status Evaluation Utility", () => {
  it("should return enabled when module is enabled system-wide and for org", () => {
    const res = evaluateModuleStatus({ finance: true }, { finance: true }, "finance");
    expect(res.isEnabled).toBe(true);
    expect(res.systemEnabled).toBe(true);
    expect(res.orgEnabled).toBe(true);
  });

  it("should return disabled when module is disabled system-wide regardless of org setting", () => {
    const res = evaluateModuleStatus({ finance: false }, { finance: true }, "finance");
    expect(res.isEnabled).toBe(false);
    expect(res.systemEnabled).toBe(false);
    expect(res.orgEnabled).toBe(true);
    expect(res.reason).toContain("Disabled system-wide");
  });

  it("should return disabled when module is enabled system-wide but disabled for org", () => {
    const res = evaluateModuleStatus({ finance: true }, { finance: false }, "finance");
    expect(res.isEnabled).toBe(false);
    expect(res.systemEnabled).toBe(true);
    expect(res.orgEnabled).toBe(false);
    expect(res.reason).toContain("Disabled for this organization");
  });

  it("should evaluate all platform modules", () => {
    const list = evaluateAllModulesStatus({ finance: false }, { android_app: false });
    expect(list.length).toBe(PLATFORM_MODULES.length);

    const finance = list.find((m) => m.moduleKey === "finance");
    expect(finance?.isEnabled).toBe(false);

    const android = list.find((m) => m.moduleKey === "android_app");
    expect(android?.isEnabled).toBe(false);

    const pos = list.find((m) => m.moduleKey === "pos");
    expect(pos?.isEnabled).toBe(true);
  });
});
