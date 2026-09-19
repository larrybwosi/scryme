import { Suspense } from "react";
import StockReceptionClient from "./client";

export const metadata = {
  title: "Stock Reception & Batch Traceability | Scryme Stocking",
  description: "Receive supplier deliveries from purchase orders and stock transfers with batch, expiry, and document details.",
};

export default function StockReceptionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Stock Reception...</div>}>
      <StockReceptionClient />
    </Suspense>
  );
}
