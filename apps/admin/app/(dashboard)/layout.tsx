import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { requireSuperAdmin } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireSuperAdmin();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userEmail={user.email} />
        <main className="custom-scrollbar flex-1 h-full overflow-y-auto">
          <div className="mx-auto w-full px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
