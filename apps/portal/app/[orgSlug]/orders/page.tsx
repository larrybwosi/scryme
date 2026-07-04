import { requireSession } from "@/app/lib/session";
import { db } from "@repo/db";
import { Table, TableBody, TableCell, TableRow } from "@repo/ui";
export default async function OrdersPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = await params;
  const session = await requireSession(orgSlug);
  const txs = await db.transaction.findMany({ where: { customerId: session.customerId, organizationId: session.orgId } });
  return (<Table><TableBody>{txs.map(t => (<TableRow key={tx.id}><TableCell>{t.id}</TableCell></TableRow>))}</TableBody></Table>);
}