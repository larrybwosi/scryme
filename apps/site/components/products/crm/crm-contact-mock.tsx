import { colors, fonts } from "@/lib/scryme-tokens";

const entries = [
  {
    time: "09:14",
    kind: "Call · 18 min",
    text: "Discussed renewal terms with R. Vale. Budget approved for Q3.",
  },
  {
    time: "11:40",
    kind: "Email",
    text: "Sent updated contract redline for legal review.",
  },
  {
    time: "14:02",
    kind: "Meeting",
    text: "Kickoff scheduled with Ops team for onboarding, Sep 3.",
  },
  {
    time: "16:55",
    kind: "Note",
    text: "Flag: parent account Norrbom Holdings has 2 open tickets.",
  },
];

export function CrmContactMock() {
  return (
    <div
      className="rounded-md border py-1"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
    >
      {entries.map((entry, i) => (
        <div
          key={entry.time}
          className={`grid grid-cols-[74px_1fr] gap-3.5 px-5 py-3.5 ${
            i < entries.length - 1 ? "border-b border-dashed" : ""
          }`}
          style={{ borderColor: colors.inkLine }}
        >
          <div
            className="pt-0.5 text-[11px]"
            style={{ fontFamily: fonts.mono, color: colors.textFaint }}
          >
            {entry.time}
          </div>
          <div>
            <div
              className="mb-1 text-[10px] uppercase tracking-[0.05em]"
              style={{ fontFamily: fonts.mono, color: colors.brass }}
            >
              {entry.kind}
            </div>
            <div className="text-[13px]" style={{ color: colors.textMuted }}>
              {entry.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
