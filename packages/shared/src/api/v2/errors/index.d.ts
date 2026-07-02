export declare class ApiError extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly code: string;
    readonly details?: any | undefined;
    constructor(message: string, statusCode: number, code: string, details?: any | undefined);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, details?: any);
}
