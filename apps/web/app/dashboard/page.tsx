import { Metadata } from "next";
import { getServerAuth } from "@repo/auth/server";
import { getDashboardData } from "../actions/dashboard";
import { DashboardClient } from "./dashboard-client";
import { format } from "date-fns";
import { Suspense } from "react";
import { db } from "@repo/db";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "./loading";

export const metadata: Metadata = {
  title: "Dashboard | Scryme",
  description:
    "View key metrics, sales revenue, top category distribution, recent activity, sales heatmap, and top products.",
};

async function DashboardContent({
  auth,
  timeframe,
  compare,
  tab,
}: {
  auth: NonNullable<Awaited<ReturnType<typeof getServerAuth>>>;
  timeframe: string;
  compare: string;
  tab: string;
}) {
  const [data, organization] = await Promise.all([
    getDashboardData(timeframe, compare),
    db.organization.findUnique({
      where: { id: auth.organizationId },
      include: { settings: true },
    }),
  ]);

  const currency = organization?.settings?.defaultCurrency || "USD";
  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  return (
    <DashboardClient
      data={data}
      userName={auth.user.name}
      date={today}
      currency={currency}
      initialTab={tab}
    />
  );
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ timeframe?: string; compare?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const timeframe = searchParams.timeframe || "month";
  const compare = searchParams.compare || "previous_period";
  const tab = searchParams.tab || "overview";

  const auth = await getServerAuth();

  if (!auth || !auth.organizationId) {
    redirect("/login");
  }

  return (
    <div className="p-6 md:p-8 max-w-(--breakpoint-2xl) mx-auto bg-background min-h-screen space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          auth={auth}
          timeframe={timeframe}
          compare={compare}
          tab={tab}
        />
      </Suspense>
    </div>
  );
}
