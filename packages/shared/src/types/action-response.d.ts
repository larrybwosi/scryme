export interface ActionResponse<TData = null> {
    success: boolean;
    message?: string;
    data?: TData;
    errors?: Record<string, string[]> | null | any;
}
