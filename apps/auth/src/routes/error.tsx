import { createFileRoute } from "@tanstack/react-router";
import { ErrorPage } from "@/pages/Error";

export const Route = createFileRoute("/error")({
  component: ErrorPage,
});
