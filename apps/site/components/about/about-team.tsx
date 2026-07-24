import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

interface AboutTeamProps {
  eyebrow: string;
  title: string;
  team: {
    name: string;
    role: string;
    initials: string;
    avatar?: {
      asset?: any;
      url?: string;
      alt?: string;
    };
  }[];
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
          {team.map(({ name, role, initials, avatar }) => {
            const avatarUrl = avatar ? (avatar.url || urlFor(avatar).width(200).height(200).url()) : null;
            return (
              <div key={name} className="text-center group">
                <div className="mx-auto mb-3 relative h-16 w-16 overflow-hidden rounded-md border flex items-center justify-center"
                  style={{
                    borderColor: colors.brassLine,
                    background: colors.brassDim,
                  }}
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={avatar?.alt || name}
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <span
                      className="text-lg"
                      style={{
                        fontFamily: fonts.mono,
                        color: colors.brass,
                      }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
                <p
                  className="text-sm font-medium transition-colors group-hover:text-brass"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
