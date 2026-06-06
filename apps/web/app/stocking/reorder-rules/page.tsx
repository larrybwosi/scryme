import React from 'react';
import { PageHeader } from "../../../components/page-header";
import { getReorderRules, upsertReorderRule } from "../../actions/stock-management";
import { getInventoryLocations, getInventoryProducts } from "../../actions/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Bell, Settings, Plus, Save, AlertCircle } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";

export default async function ReorderRulesPage() {
  const [rules, locations, products] = await Promise.all([
    getReorderRules(),
    getInventoryLocations(),
    getInventoryProducts({ stockLevel: "all" })
  ]);

  const handleSave = async (formData: FormData) => {
    "use server";
    const productId = formData.get("productId") as string;
    const locationId = formData.get("locationId") as string;
    const minQuantity = Number(formData.get("minQuantity"));
    const maxQuantity = Number(formData.get("maxQuantity"));
    const reorderQuantity = Number(formData.get("reorderQuantity"));

    if (productId && locationId) {
      await upsertReorderRule({
        productId,
        locationId,
        minQuantity,
        maxQuantity,
        reorderQuantity
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <PageHeader
        title="Automated Reorder Rules"
        description="Configure thresholds for automatic stock replenishment and alerts."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Add New Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Product</label>
                <select name="productId" required className="w-full p-2 border rounded-md bg-white text-sm">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Location</label>
                <select name="locationId" required className="w-full p-2 border rounded-md bg-white text-sm">
                  <option value="">Select location...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Min (Trigger)</label>
                  <input type="number" name="minQuantity" required className="w-full p-2 border rounded-md text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Max (Target)</label>
                  <input type="number" name="maxQuantity" required className="w-full p-2 border rounded-md text-sm" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Reorder Amount</label>
                <input type="number" name="reorderQuantity" required className="w-full p-2 border rounded-md text-sm" placeholder="0" />
              </div>
              <Button type="submit" className="w-full gap-2">
                <Save size={16} /> Save Rule
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} className="text-gray-400" />
              Active Reorder Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Min Qty</TableHead>
                  <TableHead className="text-right">Max Qty</TableHead>
                  <TableHead className="text-right">Reorder Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      No reorder rules configured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.product.name}</TableCell>
                      <TableCell>{rule.location.name}</TableCell>
                      <TableCell className="text-right">{rule.minQuantity.toNumber()}</TableCell>
                      <TableCell className="text-right">{rule.maxQuantity.toNumber()}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{rule.reorderQuantity.toNumber()}</TableCell>
                      <TableCell>
                        {rule.isActive ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-bold text-amber-900">How Reorder Rules Work</h4>
          <p className="text-xs text-amber-800 mt-1">
            When the stock level at a specific location drops below the <strong>Min Quantity</strong>, the system will automatically generate a purchase alert or order for the <strong>Reorder Amount</strong> to reach your <strong>Max Quantity</strong> target.
          </p>
        </div>
      </div>
    </div>
  );
}
