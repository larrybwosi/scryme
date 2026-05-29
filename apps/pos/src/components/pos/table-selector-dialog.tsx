import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePosStore } from '@/store/store';
import { cn } from '@/lib/utils';
import { Users, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface TableSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTable: (tableNumber: string, guestsCount?: number) => void;
}

export function TableSelectorDialog({ open, onOpenChange, onSelectTable }: TableSelectorDialogProps) {
  const tables = usePosStore(state => state.tables);
  const currentTableNumber = usePosStore(state => state.currentOrder.tableNumber);
  const recallUnpaidOrder = usePosStore(state => state.recallUnpaidOrder);

  const [selectedTableForGuests, setSelectedTableForGuests] = useState<any>(null);
  const [guestsInput, setGuestsInput] = useState<string>('1');

  useEffect(() => {
    if (open) {
      setSelectedTableForGuests(null);
      setGuestsInput('1');
    }
  }, [open]);

  const sortedTables = [...tables].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Table</DialogTitle>
        </DialogHeader>

        {selectedTableForGuests ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Table {selectedTableForGuests.number}</h3>
              <p className="text-muted-foreground flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4" /> Capacity: {selectedTableForGuests.capacity}
              </p>
            </div>
            
            <div className="w-full max-w-xs space-y-3">
              <Label className="text-center block text-sm font-medium">Number of Guests</Label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setGuestsInput(prev => Math.max(1, parseInt(prev || '1') - 1).toString())}
                >
                  -
                </Button>
                <Input 
                  type="number" 
                  className="text-center text-xl font-bold h-12 no-spinners" 
                  value={guestsInput}
                  onChange={e => setGuestsInput(e.target.value)}
                  min={1}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setGuestsInput(prev => (parseInt(prev || '0') + 1).toString())}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-xs pt-4">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setSelectedTableForGuests(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button 
                className="flex-1 h-12" 
                onClick={() => {
                  const guests = parseInt(guestsInput);
                  if (isNaN(guests) || guests <= 0) {
                    toast.error("Please enter a valid number of guests");
                    return;
                  }
                  onSelectTable(selectedTableForGuests.number, guests);
                  onOpenChange(false);
                }}
              >
                Confirm <UtensilsCrossed className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {sortedTables.map(table => {
              const isSelected = table.number === currentTableNumber;
              const isOccupied = table.status === 'occupied' && !isSelected;

              return (
                <button
                  key={table.id}
                  onClick={() => {
                    if (isOccupied) {
                      if (table.currentOrderId) {
                        recallUnpaidOrder(table.currentOrderId);
                        toast.success(`Recalled order for Table ${table.number}`);
                        onOpenChange(false);
                      }
                    } else {
                      setSelectedTableForGuests(table);
                      setGuestsInput(table.capacity?.toString() || '1');
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all aspect-square relative',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : isOccupied
                        ? 'border-destructive bg-destructive/10 text-destructive shadow-sm'
                        : 'border-muted hover:border-primary/50 hover:bg-muted'
                  )}
                >
                  {isOccupied && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                    </span>
                  )}
                  <span className="text-xl font-bold mb-1">{table.number}</span>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity}</span>
                  </div>
                  {table.section && (
                    <span className="text-[10px] mt-1 uppercase tracking-wider opacity-70 truncate max-w-full">
                      {table.section}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {tables.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No tables configured. Go to "Manage Tables" to add some.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
