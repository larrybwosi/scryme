"use client";

import posthog from "posthog-js";

type CTAContext = {
  location: string;
  cta_label: string;
  destination: string;
  cta_type?: "primary" | "secondary" | "signin" | "signup" | "plan" | "download";
  module?: string;
  plan_name?: string;
  platform?: string;
  selected_variant?: string;
  variant?: string;
};

export function captureCtaClicked(event: string, context: CTAContext) {
  posthog.capture(event, context);
}
