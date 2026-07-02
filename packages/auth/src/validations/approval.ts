import { z } from "zod";
import {
  ApprovalActionType,
  ApprovalMode,
  ConditionType,
  MemberRole,
} from "@repo/db";

const ZodDecimal = z.number().nullable().optional();
// Schema for ApprovalStepAction Input
export const ApprovalStepActionSchema = z
  .object({
    type: z.enum(ApprovalActionType),
    approverRole: z.enum(MemberRole).nullable().optional(),
    specificMemberId: z.cuid2().nullable().optional(),
    approvalMode: z.enum(ApprovalMode).default(ApprovalMode.ANY_ONE),
  })
  .refine(
    (data) => {
      // Ensure either approverRole or specificMemberId is set based on type
      if (data.type === ApprovalActionType.ROLE && !data.approverRole) {
        return false;
      }
      if (
        data.type === ApprovalActionType.SPECIFIC_MEMBER &&
        !data.specificMemberId
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Either 'approverRole' or 'specificMemberId' must be provided based on the 'type'",
      path: ["approverRole", "specificMemberId"], // Path to the fields involved
    },
  );
// Schema for ApprovalStepCondition Input
export const ApprovalStepConditionSchema = z
  .object({
    type: z.enum(ConditionType),
    minAmount: ZodDecimal,
    maxAmount: ZodDecimal,
    locationId: z.cuid2().nullable().optional(),
    expenseCategoryId: z.cuid2().nullable().optional(),
  })
  .refine(
    (data) => {
      // Add specific validation based on type if needed
      if (
        data.type === ConditionType.AMOUNT_RANGE &&
        data.minAmount === undefined &&
        data.maxAmount === undefined
      ) {
        return false; // Must provide at least min or max for amount range
      }
      if (data.type === ConditionType.LOCATION && !data.locationId) {
        return false;
      }
      if (
        data.type === ConditionType.EXPENSE_CATEGORY &&
        !data.expenseCategoryId
      ) {
        return false;
      }
      // Ensure minAmount is less than maxAmount if both are provided
      if (
        data.minAmount !== null &&
        data.maxAmount !== null &&
        data.minAmount !== undefined &&
        data.maxAmount !== undefined &&
        data.minAmount >= data.maxAmount
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Invalid condition properties for the selected type or amount range.",
      // Adjust path based on specific refinement failure
      path: ["minAmount", "maxAmount", "locationId", "expenseCategoryId"],
    },
  );
// Schema for ApprovalWorkflowStep Input
export const ApprovalWorkflowStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  name: z.string().min(1, "Step name cannot be empty"),
  description: z.string().nullable().optional(),
  allConditionsMustMatch: z.boolean().default(true),
  conditions: z
    .array(ApprovalStepConditionSchema)
    .min(1, "Each step must have at least one condition"),
  actions: z
    .array(ApprovalStepActionSchema)
    .min(1, "Each step must have at least one action"),
});
// For creating/updating an entire ApprovalWorkflow
export const ApprovalWorkflowInputSchema = z.object({
  name: z.string().min(1, "Workflow name cannot be empty."),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(), // Usually managed by setActiveWorkflow
  steps: z
    .array(ApprovalWorkflowStepSchema)
    .min(1, "Workflow must have at least one step.")
    .refine(
      (steps) => {
        // Check for unique step numbers
        const stepNumbers = steps.map((s) => s.stepNumber);
        return new Set(stepNumbers).size === stepNumbers.length;
      },
      { message: "Step numbers must be unique within the workflow." },
    ),
});
// Main Schema for ApprovalWorkflow Update Input Data
export const WorkflowUpdateInputSchema = z.object({
  name: z.string().min(1, "Workflow name cannot be empty").optional(), // Optional for update
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  steps: z
    .array(ApprovalWorkflowStepSchema)
    .min(1, "Workflow must have at least one step")
    .refine(
      (steps) => {
        // Ensure step numbers are unique
        const stepNumbers = steps.map((s) => s.stepNumber);
        return new Set(stepNumbers).size === stepNumbers.length;
      },
      {
        message: "Step numbers must be unique within a workflow",
        path: ["steps"],
      },
    ),
});
