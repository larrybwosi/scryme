import { ScanLine, Clock } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";

const receiptStats = [
  { label: "Avg. checkout time", value: "4.8s", qty: "PER SALE" },
  { label: "Offline runway", value: "72h", qty: "NO SIGNAL" },
  { label: "Sync conflicts", value: "0", qty: "CRDT MERGE" },
  { label: "Terminals per store", value: "∞", qty: "NO LICENSE CAP" },
];

const tornEdge =
  "polygon(0% 1.5%, 2% 0%, 4% 1.5%, 6% 0%, 8% 1.5%, 10% 0%, 12% 1.5%, 14% 0%, 16% 1.5%, 18% 0%, 20% 1.5%, 22% 0%, 24% 1.5%, 26% 0%, 28% 1.5%, 30% 0%, 32% 1.5%, 34% 0%, 36% 1.5%, 38% 0%, 40% 1.5%, 42% 0%, 44% 1.5%, 46% 0%, 48% 1.5%, 50% 0%, 52% 1.5%, 54% 0%, 56% 1.5%, 58% 0%, 60% 1.5%, 62% 0%, 64% 1.5%, 66% 0%, 68% 1.5%, 70% 0%, 72% 1.5%, 74% 0%, 76% 1.5%, 78% 0%, 80% 1.5%, 82% 0%, 84% 1.5%, 86% 0%, 88% 1.5%, 90% 0%, 92% 1.5%, 94% 0%, 96% 1.5%, 98% 0%, 100% 1.5%, 100% 98.5%, 98% 100%, 96% 98.5%, 94% 100%, 92% 98.5%, 90% 100%, 88% 98.5%, 86% 100%, 84% 98.5%, 82% 100%, 80% 98.5%, 78% 100%, 76% 98.5%, 74% 100%, 72% 98.5%, 70% 100%, 68% 98.5%, 66% 100%, 64% 98.5%, 62% 100%, 60% 98.5%, 58% 100%, 56% 98.5%, 54% 100%, 52% 98.5%, 50% 100%, 48% 98.5%, 46% 100%, 44% 98.5%, 42% 100%, 40% 98.5%, 38% 100%, 36% 98.5%, 34% 100%, 32% 98.5%, 30% 100%, 28% 98.5%, 26% 100%, 24% 98.5%, 22% 100%, 20% 98.5%, 18% 100%, 16% 98.5%, 14% 100%, 12% 98.5%, 10% 100%, 8% 98.5%, 6% 100%, 4% 98.5%, 2% 100%, 0% 98.5%)";

export function PosReceiptTape() {
  return (
    <section className="py-20" style={{ background: colors.inkBg }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl">
          <div
            className="relative shadow-2xl"
            style={{
              background: colors.paper,
              color: "#221C13",
              clipPath: tornEdge,
            }}
          >
            <div
              className="px-8 py-10 sm:px-14 sm:py-14"
              style={{ fontFamily: fonts.mono }}
            >
              <div className="mb-8 text-center">
                <p
                  className="text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: "rgba(34,28,19,0.5)" }}
                >
                  Scryme POS
                </p>
                <p
                  className="text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: "rgba(34,28,19,0.5)" }}
                >
                  Live performance receipt
                </p>
                <div
                  className="mt-4 border-t border-dashed"
                  style={{ borderColor: "rgba(34,28,19,0.2)" }}
                />
              </div>
              <dl className="space-y-4">
                {receiptStats.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <div>
                      <dt className="text-sm">{row.label}</dt>
                      <p
                        className="text-[10px] tracking-widest"
                        style={{ color: "rgba(34,28,19,0.4)" }}
                      >
                        {row.qty}
                      </p>
                    </div>
                    <dd
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: colors.ledgerRust }}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div
                className="mt-8 flex items-center justify-between border-t border-dashed pt-5 text-[11px] tracking-widest"
                style={{
                  borderColor: "rgba(34,28,19,0.2)",
                  color: "rgba(34,28,19,0.5)",
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ScanLine className="h-3.5 w-3.5" />
                  VERIFIED · CRDT SYNC
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  UPDATED REAL-TIME
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
