import { getOrganizationBySlug } from "@/app/lib/org";
import { notFound } from "next/navigation";
import { Button } from "@repo/ui";
export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: { orgSlug: string } }) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) notFound();
  return (<div><header><Button asChild><a href={"/" + orgSlug + "/dashboard"}>Dashboard</a></Button></header>{children}</div>);
}