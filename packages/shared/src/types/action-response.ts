// Standardized response structure for actions
export interface ActionResponse<TData = null> {
  success: boolean;
  message?: string; // User-friendly message for UI feedback
  data?: TData;
  errors?: Record<string, string[]> | null | any; // Field-specific validation errors
}
