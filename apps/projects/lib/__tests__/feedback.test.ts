import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  getResolvedAuthUrl: vi.fn(() => "https://auth.example.test"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.success,
    error: mocks.error,
    warning: mocks.warning,
  },
}));

vi.mock("../urls", () => ({
  getResolvedAuthUrl: mocks.getResolvedAuthUrl,
}));

vi.mock("@repo/env", () => ({
  env: {
    NEXT_PUBLIC_AUTH_URL: "https://auth.example.test",
    NODE_ENV: "test",
  },
}));

import {
  TOAST_ERROR_DURATION,
  TOAST_MAX_VISIBLE,
  TOAST_SUCCESS_DURATION,
  fieldErrorsFrom,
  getErrorMessage,
  isUnprocessable,
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../feedback";

const originalLocation = window.location;

function stubLocation() {
  const location = { href: "" };
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: location,
  });
  return location;
}

describe("getErrorMessage", () => {
  it("maps status codes to the shared copy", () => {
    expect(getErrorMessage({ response: { status: 401 } })).toBe(
      "Your session expired. Sign in again",
    );
    expect(getErrorMessage({ status: 403 })).toBe(
      "You do not have permission for this action",
    );
    expect(getErrorMessage({ response: { status: 404 } })).toBe("This item was not found");
    expect(getErrorMessage({ response: { status: 409 } })).toBe(
      "This item changed. Reload and try again",
    );
    expect(getErrorMessage({ response: { status: 422 } })).toBe(
      "Check the highlighted fields",
    );
  });

  it("maps network failures to the shared copy", () => {
    expect(getErrorMessage({ code: "ERR_NETWORK" })).toBe(
      "Cannot reach the server. Try again",
    );
    expect(getErrorMessage({ message: "Network Error" })).toBe(
      "Cannot reach the server. Try again",
    );
  });

  it("prefers server messages, then the fallback, then the default", () => {
    expect(
      getErrorMessage({ response: { data: { message: "Project key is taken" } } }),
    ).toBe("Project key is taken");
    expect(getErrorMessage({ response: { status: 500 } }, "Could not load tasks")).toBe(
      "Could not load tasks",
    );
    expect(getErrorMessage({ response: { status: 500 } })).toBe(
      "Something went wrong. Try again",
    );
  });
});

describe("toast helpers", () => {
  it("uses the success duration and a dismiss button", () => {
    notifySuccess("Task created");

    expect(mocks.success).toHaveBeenCalledWith("Task created", {
      duration: TOAST_SUCCESS_DURATION,
      closeButton: true,
    });
    expect(TOAST_SUCCESS_DURATION).toBe(4000);
    expect(TOAST_MAX_VISIBLE).toBe(3);
  });

  it("uses the error duration and maps the error copy", () => {
    notifyError({ response: { status: 500 } }, "Could not delete task");

    expect(mocks.error).toHaveBeenCalledWith("Could not delete task", {
      duration: TOAST_ERROR_DURATION,
      closeButton: true,
    });
    expect(TOAST_ERROR_DURATION).toBe(6000);
  });

  it("uses the success duration for warnings", () => {
    notifyWarning("Changes were not saved");

    expect(mocks.warning).toHaveBeenCalledWith("Changes were not saved", {
      duration: TOAST_SUCCESS_DURATION,
      closeButton: true,
    });
  });
});

describe("notifyError session expiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it("redirects to the auth app after a 401", () => {
    const location = stubLocation();

    notifyError({ response: { status: 401 } });

    expect(location.href).toBe("");
    vi.advanceTimersByTime(800);

    expect(mocks.getResolvedAuthUrl).toHaveBeenCalledTimes(1);
    expect(location.href).toBe("https://auth.example.test/sign-in");
  });

  it("does not redirect for other failures", () => {
    const location = stubLocation();

    notifyError({ response: { status: 500 } });
    vi.advanceTimersByTime(800);

    expect(location.href).toBe("");
    expect(mocks.getResolvedAuthUrl).not.toHaveBeenCalled();
  });
});

describe("form field errors", () => {
  it("only treats 422 responses as validation errors", () => {
    expect(isUnprocessable({ response: { status: 422 } })).toBe(true);
    expect(isUnprocessable({ response: { status: 400 } })).toBe(false);
  });

  it("normalises the known 422 payload shapes", () => {
    expect(
      fieldErrorsFrom({
        response: {
          status: 422,
          data: {
            fields: { title: "Title is required" },
            errors: [{ path: "estimatedHours", message: "Must be a number" }],
            message: ["priority Invalid priority"],
          },
        },
      }),
    ).toEqual({
      title: "Title is required",
      estimatedHours: "Must be a number",
      priority: "priority Invalid priority",
    });
  });

  it("returns no field errors for non validation failures", () => {
    expect(
      fieldErrorsFrom({ response: { status: 500, data: { fields: { title: "no" } } } }),
    ).toEqual({});
  });
});
