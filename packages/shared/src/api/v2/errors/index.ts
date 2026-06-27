export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
