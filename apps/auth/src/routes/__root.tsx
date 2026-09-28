import { createRootRoute, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <AuthLayout>
        <Outlet />
      </AuthLayout>
      <Toaster position="top-right" />
      <ScrollRestoration />
    </>
  );
}
