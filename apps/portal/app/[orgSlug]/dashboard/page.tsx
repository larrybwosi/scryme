import { requireSession } from "@/app/lib/session.server";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui";
import { ShoppingBag, CreditCard, Package, ArrowUpRight } from "lucide-react";

export default async function DashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireSession(orgSlug);

  const stats = [
    { title: "Total Orders", value: "0", icon: ShoppingBag, description: "All-time orders" },
    { title: "Pending Payments", value: "$0.00", icon: CreditCard, description: "Awaiting settlement" },
    { title: "Active Shipments", value: "0", icon: Package, description: "Currently in transit" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your business account.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest transactions will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground italic">
              No recent orders found.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Account Notifications</CardTitle>
            <CardDescription>Stay updated with your account activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground italic">
              All caught up!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
