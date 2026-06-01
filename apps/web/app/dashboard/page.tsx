import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const auth = await getServerAuth();

  if (!auth) {
    redirect("/login");
  }

  if (!auth.organizationId) {
    redirect("/create-org");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome back, {auth.user.name}!</p>
      <p className="mt-2 text-gray-600">Organization ID: {auth.organizationId}</p>
    </div>
  );
}
