import NextImage from 'next/image';

export function PurchaseTable({ purchases }: { purchases: any[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-medium">
          <tr>
            <th className="px-6 py-4">Product</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4 text-right">Amount</th>
            <th className="px-6 py-4 text-right">Quantity</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="hover:bg-zinc-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 relative">
                    <NextImage
                      src={purchase.image}
                      alt={purchase.product}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium text-zinc-900">{purchase.product}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-zinc-600">{purchase.category}</td>
              <td className="px-6 py-4 text-right font-medium text-zinc-900">
                ${purchase.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right text-zinc-600">{purchase.quantity}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    purchase.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
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
  );
}
