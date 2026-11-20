export class CustomermatesError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = "upstream_error",
  ) {
    super(message);
    this.name = "CustomermatesError";
  }
}

export class UnsafeUrlError extends CustomermatesError {
  constructor(message: string) {
    super(message, 422, "unsafe_url");
    this.name = "UnsafeUrlError";
  }
}

export class SchemaRevisionMismatchError extends CustomermatesError {
  constructor(message = "Customermates schema revision is stale") {
    super(message, 409, "schema_revision_mismatch");
    this.name = "SchemaRevisionMismatchError";
  }
}

export class RateLimitExceededError extends CustomermatesError {
  constructor(
    message = "Customermates rate limit was not cleared before the retry cap",
    public readonly retryAfterMs?: number,
  ) {
    super(message, 429, "rate_limit_exceeded");
    this.name = "RateLimitExceededError";
  }
}

export class RecordTrashedError extends CustomermatesError {
  constructor(message = "Customermates record is trashed") {
    super(message, 409, "record_trashed");
    this.name = "RecordTrashedError";
  }
}
