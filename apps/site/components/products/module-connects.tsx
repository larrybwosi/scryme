import { colors, fonts, modules, type ModuleCode } from "@/lib/scryme-tokens";

const NAMES: Record<ModuleCode, string> = {
  CRM: "PIPELINE",
  POS: "REGISTER",
  INV: "FULFILL",
  FIN: "LEDGER",
  HR: "PAYROLL",
  BI: "REPORTS",
};

export function ModuleConnects({ current }: { current: ModuleCode }) {
  const currentModule = modules.find((m) => m.code === current);
  const chain: ModuleCode[] = [current, ...(currentModule?.connectsTo ?? [])];

  return (
    <section className="border-b py-14" style={{ borderColor: colors.inkLine }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center px-6">
        {chain.map((code, i) => (
          <div key={code} className="flex items-center">
            {i > 0 && (
              <div
                className="-mt-[22px] h-px w-16"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, ${colors.brassLine} 0 6px, transparent 6px 11px)`,
                }}
              />
            )}
            <div className="flex flex-col items-center gap-2 px-7">
              <div
                className="grid h-13 w-13 place-items-center rounded-full border text-[13px]"
                style={{
                  fontFamily: fonts.mono,
                  fontWeight: 500,
                  width: 52,
                  height: 52,
                  borderColor: i === 0 ? colors.brassLine : colors.inkLine,
                  background: i === 0 ? colors.brassDim : colors.inkPanel,
                  color: i === 0 ? colors.brass : colors.textMuted,
                }}
              >
                {code}
              </div>
              <div
                className="text-[11px] tracking-[0.03em]"
                style={{ fontFamily: fonts.mono, color: colors.textFaint }}
              >
                {NAMES[code]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
