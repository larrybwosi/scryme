"use client";

import { toast } from "sonner";
import { env } from "@repo/env";
import { getResolvedAuthUrl } from "./urls";

export const TOAST_SUCCESS_DURATION = 4000;
export const TOAST_ERROR_DURATION = 6000;
export const TOAST_MAX_VISIBLE = 3;

type UnknownError = unknown;

function statusOf(error: UnknownError): number | undefined {
  const candidate = error as { status?: number; response?: { status?: number } };
  return candidate?.response?.status ?? candidate?.status;
}

export function getErrorMessage(error: UnknownError, fallback?: string): string {
  const status = statusOf(error);
  switch (status) {
    case 401:
      return "Your session expired. Sign in again";
    case 403:
      return "You do not have permission for this action";
    case 404:
      return "This item was not found";
    case 409:
      return "This item changed. Reload and try again";
    case 422:
      return "Check the highlighted fields";
    default:
      break;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    response?: { data?: { message?: string | string[] } };
  };
  if (candidate?.code === "ERR_NETWORK" || candidate?.message === "Network Error") {
    return "Cannot reach the server. Try again";
  }

  const responseMessage = candidate?.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  return fallback || "Something went wrong. Try again";
}

export function notifySuccess(message: string) {
  toast.success(message, {
    duration: TOAST_SUCCESS_DURATION,
    closeButton: true,
  });
}

export function notifyError(error: UnknownError, fallback?: string) {
  const status = statusOf(error);
  toast.error(getErrorMessage(error, fallback), {
    duration: TOAST_ERROR_DURATION,
    closeButton: true,
  });

  if (status === 401 && typeof window !== "undefined") {
    const authUrl = getResolvedAuthUrl(env.NEXT_PUBLIC_AUTH_URL, env.NODE_ENV);
    const timer = setTimeout(() => {
      window.location.href = `${authUrl}/sign-in`;
    }, 800);
    if (typeof timer === "object" && "unref" in timer) {
      (timer as { unref: () => void }).unref();
    }
  }
}

export function notifyWarning(message: string) {
  toast.warning(message, {
    duration: TOAST_SUCCESS_DURATION,
    closeButton: true,
  });
}

export function isUnprocessable(error: UnknownError) {
  return statusOf(error) === 422;
}

export function fieldErrorsFrom(error: UnknownError): Record<string, string> {
  if (!isUnprocessable(error)) return {};

  const data = (error as { response?: { data?: unknown } })?.response?.data as
    | {
        errors?: Array<{ field?: string; path?: string; message?: string }>;
        message?: string | string[];
        fields?: Record<string, string>;
      }
    | undefined;

  const result: Record<string, string> = {};

  if (data?.fields) {
    for (const [field, message] of Object.entries(data.fields)) {
      if (typeof message === "string") result[field] = message;
    }
  }

  if (Array.isArray(data?.errors)) {
    for (const item of data.errors) {
      const field = item?.field || item?.path;
      if (field && item?.message) result[field] = item.message;
    }
  }

  if (Array.isArray(data?.message)) {
    for (const message of data.message) {
      const [maybeField] = message.split(" ");
      const field = maybeField?.replace(/[^a-zA-Z]/g, "");
      if (field) result[field.charAt(0).toLowerCase() + field.slice(1)] = message;
    }
  }

  return result;
}
