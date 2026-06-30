// ============================================================
// client.ts — Browser-safe entrypoint: types & utilities only.
// Safe to import in client, server, and shared code.
// No Node.js dependencies — zero runtime weight for type imports.
// ============================================================

export * from "../generated/browser";

// Explicitly export enums and types needed by browser code that are missing in generated/browser
export {
  AddressType,
  CustomerCreationType,
  CrmFieldType,
  CrmRelationshipType,
  ApprovalActionType,
  ApprovalMode,
  ConditionType
} from "../generated/client";
