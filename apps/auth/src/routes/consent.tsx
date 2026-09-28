import { createFileRoute } from "@tanstack/react-router";
import { ConsentPage } from "@/pages/Consent";

export const Route = createFileRoute("/consent")({
  component: ConsentPage,
});
