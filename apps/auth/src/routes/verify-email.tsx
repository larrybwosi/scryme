import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailPage } from "@/pages/VerifyEmail";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
});
