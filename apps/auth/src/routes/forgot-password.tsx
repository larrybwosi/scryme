import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});
