import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

interface AboutTeamProps {
  eyebrow: string;
  title: string;
  team: { name: string; role: string; initials: string }[];
}

export function AboutTeam({ eyebrow, title, team }: AboutTeamProps) {
  return (
    <section className="py-24" style={{ background: colors.inkBg }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-[560px] text-center">
          <Eyebrow center>{eyebrow}</Eyebrow>
          <h2
            className="mt-4 text-[1.9rem] sm:text-[2.3rem]"
            style={{ fontFamily: fonts.display, color: colors.paper }}
          >
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {team.map(({ name, role, initials }) => (
            <div key={name} className="text-center">
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-md border text-lg"
                style={{
                  fontFamily: fonts.mono,
                  borderColor: colors.brassLine,
                  background: colors.brassDim,
                  color: colors.brass,
                }}
              >
                {initials}
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: colors.paper }}
              >
                {name}
              </p>
              <p
                className="mt-0.5 text-[11px] leading-snug"
                style={{ color: colors.textFaint }}
              >
                {role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
