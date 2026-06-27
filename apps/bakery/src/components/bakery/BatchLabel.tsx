"use client";

import { useMemo } from "react";
import { FormattedBatch } from "@/types/bakery";
import { format } from "date-fns";

interface BatchLabelProps {
  batch: FormattedBatch;
}

export function BatchLabel({ batch }: BatchLabelProps) {
  const expiryDate = batch.expiresAt ? new Date(batch.expiresAt) : null;
  const productionDate = batch.productionDate
    ? new Date(batch.productionDate)
    : new Date(batch.createdAt);

  return (
    <div className="w-[100mm] h-[60mm] p-4 bg-white text-black border border-black flex flex-col font-sans print:border-none print:m-0">
      <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
        <div>
          <h1 className="text-xl font-bold uppercase truncate max-w-[70mm]">
            {batch.recipe.name}
          </h1>
          <p className="text-sm font-mono">{batch.batchNumber}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{batch.plannedQuantity}</div>
          <div className="text-xs font-bold uppercase">{batch.unit.symbol}</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase text-gray-600">
            Produced
          </div>
          <div className="text-sm font-semibold">
            {format(productionDate, "MMM dd, yyyy")}
          </div>

          <div className="text-[10px] font-bold uppercase text-gray-600 pt-2">
            Operator
          </div>
          <div className="text-sm font-semibold">{batch.baker || "N/A"}</div>
        </div>

        <div className="space-y-1 border-l border-gray-200 pl-4">
          <div className="text-[10px] font-bold uppercase text-gray-600">
            Best Before
          </div>
          <div className="text-lg font-bold text-red-600">
            {expiryDate ? format(expiryDate, "MMM dd, yyyy") : "N/A"}
          </div>

          {batch.tags && batch.tags.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1">
              {batch.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[8px] bg-gray-100 px-1 border border-gray-300 rounded uppercase font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-2 flex flex-col items-center border-t border-black/10">
        {/* Placeholder for Barcode - In a real app we'd use a barcode generator library */}
        <div className="w-full h-8 bg-black/5 flex items-center justify-center border border-dashed border-gray-400">
          <span className="text-[8px] font-mono tracking-[0.5em]">
            {batch.batchNumber}
          </span>
        </div>
        <div className="text-[8px] mt-1 font-mono">{batch.id}</div>
      </div>
    </div>
  );
}
