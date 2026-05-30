import { MoreHorizontal } from 'lucide-react';

const purchases = [
  { id: '#102121', product: '5 Star Quality Bed Set', image: 'https://api.dicebear.com/7.x/initials/svg?seed=BS', supplier: 'Ikea Store', date: '03/12/2024', quantity: 500, price: '$1,500', total: '$14,000' },
  { id: '#102120', product: '2 Sofa Set', image: 'https://api.dicebear.com/7.x/initials/svg?seed=SS', supplier: 'Hatil Furniture', date: '04/12/2024', quantity: 200, price: '$1,000', total: '$20,000' },
  { id: '#102119', product: 'Washroom Glass Set', image: 'https://api.dicebear.com/7.x/initials/svg?seed=GS', supplier: 'Bendor Sentry Shop', date: '05/12/2024', quantity: 200, price: '$500', total: '$5,000' },
  { id: '#102118', product: 'Hand Wash 100 Pices', image: 'https://api.dicebear.com/7.x/initials/svg?seed=HW', supplier: 'Bin Dawood Super', date: '06/12/2024', quantity: 100, price: '$3,500', total: '$14,000' },
  { id: '#102117', product: '500 Set Tissue Box', image: 'https://api.dicebear.com/7.x/initials/svg?seed=TB', supplier: 'Kazis Store', date: '07/12/2024', quantity: 455, price: '$400', total: '$12,000' },
  { id: '#102116', product: 'Bed Set 4 Pax Use', image: 'https://api.dicebear.com/7.x/initials/svg?seed=BS', supplier: 'Bestbuy Furniture', date: '08/12/2024', quantity: 344, price: '$100', total: '$10,000' },
  { id: '#102115', product: 'Computer 4 Set', image: 'https://api.dicebear.com/7.x/initials/svg?seed=CS', supplier: 'Sky View Computer', date: '09/12/2024', quantity: 988, price: '$300', total: '$19,000' },
  { id: '#102114', product: 'Toilet Tissue 500 Ps', image: 'https://api.dicebear.com/7.x/initials/svg?seed=TT', supplier: 'Khans Store', date: '10/12/2024', quantity: 15123, price: '$100', total: '$80,000' },
  { id: '#102113', product: 'Hand Wash Set', image: 'https://api.dicebear.com/7.x/initials/svg?seed=HS', supplier: 'Bin Dawood Super', date: '11/12/2024', quantity: 500, price: '$1500', total: '$14,000' },
  { id: '#102112', product: 'Sofa Set Gray', image: 'https://api.dicebear.com/7.x/initials/svg?seed=SG', supplier: 'Ikea Store', date: '12/12/2024', quantity: 433, price: '$1600', total: '$19,000' },
];

export function PurchaseTable() {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4">
                <input type="checkbox" className="rounded border-border w-4 h-4 text-primary focus:ring-primary" />
              </th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Invoice No</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Name of Product</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Supplier Name</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Purchase Date</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded border-border w-4 h-4 text-primary focus:ring-primary" />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{purchase.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border shadow-sm">
                      <img src={purchase.image} alt="Supplier logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold">{purchase.product}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{purchase.supplier}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{purchase.date}</td>
                <td className="px-6 py-4 text-sm font-bold">{purchase.quantity.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-bold">{purchase.price}</td>
                <td className="px-6 py-4 text-sm font-extrabold">{purchase.total}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-border bg-white flex items-center justify-between">
        <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
          ← Previous
        </button>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4a9c6d] text-white text-sm font-bold">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-sm font-medium">2</button>
          <span className="text-muted-foreground mx-1">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-sm font-medium">10</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-sm font-medium">12</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-sm font-medium">13</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-sm font-medium">14</button>
        </div>
        <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
          Next →
        </button>
      </div>
    </div>
  );
}
