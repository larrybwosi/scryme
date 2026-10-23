import { createFileRoute } from "@tanstack/react-router";
import { MobileCallbackPage } from "@/pages/MobileCallback";

export const Route = createFileRoute("/mobile-callback")({
  component: MobileCallbackPage,
});
