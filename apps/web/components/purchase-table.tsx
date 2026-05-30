import NextImage from "next/image";

export function PurchaseTable({ purchases }: { purchases: any[] }) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  className="rounded border-border w-4 h-4 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Invoice No
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Product
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Category
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">
                Amount
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">
                Quantity
              </th>
              <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map((purchase) => (
              <tr
                key={purchase.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-border w-4 h-4 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4 text-muted-foreground font-medium">
                  {purchase.id}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg border border-border bg-muted relative shadow-sm">
                      <NextImage
                        src={purchase.image}
                        alt={purchase.product}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium text-foreground">
                      {purchase.product}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {purchase.category}
                </td>
                <td className="px-6 py-4 text-right font-medium text-foreground">
                  ${purchase.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {purchase.quantity}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      purchase.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {purchase.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
