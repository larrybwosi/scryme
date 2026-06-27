import {
  Printer,
  RefreshCcw,
  Settings2,
  FileText,
  Receipt,
  ChefHat,
  ReceiptText,
  Truck,
  GlassWater,
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Switch } from '@repo/ui/components/ui/switch';
import { Label } from '@repo/ui/components/ui/label';
import { Separator } from '@repo/ui/components/ui/separator';
import { usePrinter } from '@/hooks/use-printer';
import { PrinterJobType } from '@/store/printer-store';
import { usePosStore } from '@/store/store';

export default function PrinterSettings() {
  const {
    availablePrinters,
    assignments,
    assignPrinter,
    refreshPrinters,
    loading,
    printDocument,
    autoPrintInvoice,
    setAutoPrintInvoice,
  } = usePrinter();

  const settings = usePosStore(state => state.settings);
  const updateBusinessSettings = usePosStore(state => state.updateBusinessSettings);

  // Helper to test specific roles
  const handleTest = async (type: PrinterJobType) => {
    try {
      // Mock order for test
      const testOrder = {
        id: 'test-id',
        orderNumber: 'TEST-001',
        items: [
          { productName: 'Test Item 1', quantity: 1, price: 100, total: 100 },
          { productName: 'Test Item 2', quantity: 2, price: 50, total: 100 },
        ],
        subTotal: 200,
        taxAmount: 0,
        total: 200,
        createdAt: new Date().toISOString(),
        cashierName: 'Admin',
      };

      await printDocument(type, testOrder, settings);

      alert(`Sent test to ${type} printer!`);
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message || 'Print failed'}`);
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-lg">
            <Printer className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Printer Configuration</h2>
            <p className="text-sm text-muted-foreground">Manage devices and assign roles</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refreshPrinters} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Searching...' : 'Refresh List'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Role Assignments */}
        <div className="space-y-6">
          <h3 className="font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Role Assignments
          </h3>

          <div className="space-y-4">
            {/* 1. Receipt Printer Assignment */}
            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-orange-600" />
                <label className="text-sm font-semibold">Receipt Printer</label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Used for POS thermal receipts (58mm/80mm)</p>

              <div className="flex gap-2">
                <Select value={assignments.receipt || ''} onValueChange={val => assignPrinter('receipt', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => handleTest('receipt')}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 4. Bill/Cheque Printer Assignment */}
            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ReceiptText className="h-4 w-4 text-purple-600" />
                <label className="text-sm font-semibold">Bill/Cheque Printer</label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Used for pro-forma bills (Default: Receipt Printer)</p>

              <div className="flex gap-2">
                <Select value={assignments.bill || ''} onValueChange={val => assignPrinter('bill', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Same as Receipt Printer</SelectItem>
                    {availablePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => handleTest('bill')}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 2. Invoice Printer Assignment */}
            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <label className="text-sm font-semibold">Invoice Printer</label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Used for A4 invoices and reports</p>

              <div className="flex gap-2">
                <Select value={assignments.invoice || ''} onValueChange={val => assignPrinter('invoice', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => handleTest('invoice')}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 3. Kitchen Printer (Optional) */}
            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ChefHat className="h-4 w-4 text-green-600" />
                <label className="text-sm font-semibold">Kitchen Printer</label>
              </div>
              <div className="flex gap-2">
                <Select value={assignments.kitchen || ''} onValueChange={val => assignPrinter('kitchen', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => handleTest('kitchen')}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 5. Bar Printer (Optional) */}
            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <GlassWater className="h-4 w-4 text-blue-400" />
                <label className="text-sm font-semibold">Bar Printer</label>
              </div>
              <div className="flex gap-2">
                <Select value={assignments.bar || ''} onValueChange={val => assignPrinter('bar', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => handleTest('bar')}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 6. Waybill Printer (Optional) */}
            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-zinc-600" />
                <label className="text-sm font-semibold">Waybill Printer</label>
              </div>
              <div className="flex gap-2">
                <Select value={assignments.waybill || ''} onValueChange={val => assignPrinter('waybill', val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Same as Invoice Printer</SelectItem>
                    {availablePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => handleTest('waybill')}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-indigo-600" />
                    <Label className="text-sm font-semibold">Auto-Print Receipts</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Automatically print receipt after completing payment</p>
                </div>
                <Switch
                  checked={settings.enableAutoPrint}
                  onCheckedChange={val => updateBusinessSettings({ enableAutoPrint: val })}
                />
              </div>
            </div>

            <div className="bg-background p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-semibold">Auto-Print Invoices</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically print A4 invoice after creating an order
                  </p>
                </div>
                <Switch checked={autoPrintInvoice} onCheckedChange={val => setAutoPrintInvoice(val)} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Available Devices List */}
        <div>
          <h3 className="font-medium mb-4">Detected Devices ({availablePrinters.length})</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availablePrinters.length === 0 && (
              <div className="text-sm text-muted-foreground italic">No printers found.</div>
            )}
            {availablePrinters.map(printer => {
              // Check if this printer is assigned to anythings
              const roles = (Object.keys(assignments) as PrinterJobType[]).filter(
                role => assignments[role] === printer.id
              );

              return (
                <div key={printer.id} className="p-3 border rounded text-sm hover:bg-background">
                  <div className="font-medium">{printer.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{printer.driver_name}</div>

                  {/* Badges for active roles */}
                  <div className="flex gap-1 mt-2">
                    {roles.map(role => (
                      <Badge key={role} variant="secondary" className="text-[10px] uppercase">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
