import { getOrganizationBySlug } from "@/app/lib/org";
import { startZitadelSSO, loginMockUser } from "@/app/lib/actions";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Shield, Key, ArrowRight, Activity } from "lucide-react";

export default async function LoginPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    notFound();
  }

  const hasZitadel = org.zitadelConfiguration && org.zitadelConfiguration.isActive;

  const handleSso = async () => {
    "use server";
    await startZitadelSSO(orgSlug);
  };

  const handleMockLogin = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    await loginMockUser(orgSlug, email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
            {org.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{org.name}</h1>
          <p className="text-sm text-zinc-400">B2B Customer Storefront Portal</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-md text-zinc-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-zinc-50">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
              {hasZitadel
                ? "Authenticate securely via your enterprise Single Sign-On (SSO)."
                : "Enter your business account email to access your storefront portal."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {hasZitadel && (
              <form action={handleSso} className="w-full">
                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200">
                  <Shield className="size-5" />
                  Continue with Zitadel SSO
                </Button>
              </form>
            )}

            {hasZitadel && (
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase tracking-wider">Or continue with email</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>
            )}

            <form action={handleMockLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Business Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    className="bg-zinc-950/60 border-zinc-800 text-zinc-100 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 block w-full rounded-lg"
                  />
                </div>
              </div>

              <Button type="submit" variant={hasZitadel ? "outline" : "default"} className="w-full font-semibold border-zinc-800 hover:bg-zinc-800 text-zinc-100 flex items-center justify-center gap-2 transition-colors">
                <Key className="size-4" />
                Sign In with Email
                <ArrowRight className="size-4 ml-auto" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="border-t border-zinc-800 bg-zinc-950/30 px-6 py-4 flex items-center justify-between text-xs text-zinc-500 rounded-b-xl">
            <span className="flex items-center gap-1.5">
              <Activity className="size-3.5 text-emerald-500" />
              SSO Secured
            </span>
            <span>v1.0.0</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
