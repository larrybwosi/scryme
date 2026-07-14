"use client";
import { Monitor, HardDrive, Terminal, Download } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";

const platforms = [
  { icon: Monitor, name: "Windows", format: ".msi installer", path: "windows" },
  { icon: HardDrive, name: "macOS", format: "Universal .dmg", path: "macos" },
  { icon: Terminal, name: "Linux", format: ".AppImage", path: "linux" },
];

export function PosDownloadSection() {
  return (
    <section
      className="border-t py-24"
      id="download"
      style={{ borderColor: colors.inkLine, background: colors.inkPanelAlt }}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Eyebrow center>Get Scryme POS</Eyebrow>
        <h2
          className="mb-5 mt-4 text-[2rem] sm:text-[2.6rem]"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Ready to speed up your checkout?
        </h2>
        <p
          className="mx-auto mb-12 max-w-2xl text-[15.5px]"
          style={{ color: colors.textMuted }}
        >
          Download the native Scryme POS application for your operating system.
          Fast, secure, and built for enterprise reliability.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {platforms.map(({ icon: Icon, name, format, path }) => (
            <a
              key={name}
              href={`${apiBase}/public/download/${path}`}
              className="group flex flex-col items-center rounded-md border p-7 transition-all hover:-translate-y-1"
              style={{
                borderColor: colors.inkLine,
                background: colors.inkPanel,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = colors.brassLine)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = colors.inkLine)
              }
            >
              <Icon
                className="mb-4 h-9 w-9"
                style={{ color: colors.textMuted }}
              />
              <span className="font-medium" style={{ color: colors.paper }}>
                {name}
              </span>
              <span
                className="mt-1 text-xs"
                style={{ fontFamily: fonts.mono, color: colors.textFaint }}
              >
                {format}
              </span>
              <div
                className="mt-6 flex items-center gap-2 text-sm font-medium"
                style={{ fontFamily: fonts.mono, color: colors.brass }}
              >
                <Download className="h-4 w-4" />
                Download
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
