import type { Metadata } from "next";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";

export const metadata: Metadata = {
  title: "Cookie Policy — Scryme Enterprise",
  description:
    "Learn how Scryme Technologies uses cookies and browser storage to maintain secure B2B authentication sessions.",
  alternates: {
    canonical: "/cookies",
  },
};

export default function CookiesPage() {
  return (
    <main
      style={{ background: colors.inkBg }}
      className="min-h-screen py-24 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Eyebrow>Legal & Compliance</Eyebrow>
        <h1
          className="mb-8 mt-4 text-4xl sm:text-5xl font-semibold"
          style={{ fontFamily: fonts.display, color: colors.paper }}
        >
          Cookie Policy
        </h1>
        <p
          className="text-sm font-mono mb-12"
          style={{ color: colors.textFaint }}
        >
          Last updated: October 24, 2025
        </p>

        <div
          className="space-y-8 text-base leading-relaxed"
          style={{ color: colors.textMuted, fontFamily: fonts.body }}
        >
          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              1. What are Cookies?
            </h2>
            <p>
              Cookies are small text files stored in your web browser by
              websites you visit. They are used to retain session context,
              authenticate your profile across tabs, and store your layout and
              theme preferences.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              2. How Scryme Uses Cookies
            </h2>
            <p className="mb-4">
              We restrict our cookie usage to functional, security-relevant, and
              session-critical purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <strong>better-auth.session_token:</strong> Used to map your
                active B2B storefront session to our backend.
              </li>
              <li>
                <strong>Zitadel Identity Sessions:</strong> Retains your SSO
                credentials when navigating between different workspace portals
                and applications.
              </li>
              <li>
                <strong>PostHog Analytics cookies:</strong> Strictly used to
                evaluate navigation drop-offs and optimize our web loading
                speeds.
              </li>
              <li>
                <strong>Theme states:</strong> Retains light or dark mode
                preferences inside your local storage.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: colors.paper, fontFamily: fonts.display }}
            >
              3. Managing Cookies
            </h2>
            <p>
              You can disable or delete cookies inside your browser&apos;s security
              settings. Please note that blocking essential authentication
              cookies will prevent you from logging in to our B2B storefront
              portals.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
