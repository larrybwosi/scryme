import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

export interface CashDenomination {
  value: number;
  count: number;
  label: string;
}

interface CashDenominationCounterProps {
  denominations: CashDenomination[];
  onChange: (denominations: CashDenomination[]) => void;
  currencySymbol?: string;
}

export const DEFAULT_DENOMINATIONS: CashDenomination[] = [
  { value: 100, count: 0, label: "100" },
  { value: 50, count: 0, label: "50" },
  { value: 20, count: 0, label: "20" },
  { value: 10, count: 0, label: "10" },
  { value: 5, count: 0, label: "5" },
  { value: 2, count: 0, label: "2" },
  { value: 1, count: 0, label: "1" },
  { value: 0.5, count: 0, label: "0.50" },
  { value: 0.2, count: 0, label: "0.20" },
  { value: 0.1, count: 0, label: "0.10" },
  { value: 0.05, count: 0, label: "0.05" },
];

export function CashDenominationCounter({
  denominations,
  onChange,
  currencySymbol = "$",
}: CashDenominationCounterProps) {
  const handleCountChange = (index: number, countStr: string) => {
    const count = parseInt(countStr) || 0;
    const newDenominations = [...denominations];
    newDenominations[index] = { ...newDenominations[index], count };
    onChange(newDenominations);
  };

  const total = denominations.reduce((acc, curr) => acc + curr.value * curr.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {denominations.map((denom, index) => (
          <div key={denom.value} className="flex flex-col space-y-1">
            <Label htmlFor={`denom-${denom.value}`} className="text-xs font-medium text-muted-foreground">
              {currencySymbol}{denom.label}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id={`denom-${denom.value}`}
                type="number"
                min="0"
                value={denom.count || ""}
                onChange={(e) => handleCountChange(index, e.target.value)}
                placeholder="0"
                className="h-9"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                ={currencySymbol}{(denom.value * (denom.count || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t flex justify-between items-center">
        <span className="font-semibold">Total Counted:</span>
        <span className="text-lg font-bold text-primary">
          {currencySymbol}{total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
