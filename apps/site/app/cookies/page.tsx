import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("cookies");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Cookie Policy — Scryme Enterprise",
    fallbackDescription:
      "Learn how Scryme Technologies uses cookies and browser storage to maintain secure B2B authentication sessions.",
    canonicalPath: "/cookies",
  });
}

export default async function CookiesPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <SectionHeader
          eyebrow="Storage & Privacy"
          title="Cookie Policy"
          description="Last updated: October 2025"
          align="left"
        />

        <Card className="p-8 sm:p-10 space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored in your web browser when visiting web applications. They retain session context, authenticate your profile across tabs, and store your theme preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              2. How Scryme Uses Storage
            </h2>
            <p className="mb-3">
              We restrict cookie and local storage usage strictly to functional, security-relevant, and session-critical purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>
                <strong>Authentication Tokens:</strong> Mapped to maintain secure session state with our backend services.
              </li>
              <li>
                <strong>Telemetry & Uptime:</strong> Anonymized performance tracking to optimize application rendering speeds.
              </li>
              <li>
                <strong>Theme Preferences:</strong> Stores dark or light mode choices in local storage.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              3. Managing Preferences
            </h2>
            <p>
              You can clear cookies inside your browser settings at any time. Note that clearing essential authentication tokens will sign you out of active platform sessions.
            </p>
          </section>
        </Card>
      </div>
    </main>
  );
}
