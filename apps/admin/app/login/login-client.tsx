"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert, Lock } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Sign in failed. Check your credentials and try again.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[oklch(0.14_0.006_260)] px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.96 0.003 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.96 0.003 260) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center border border-[oklch(0.32_0.01_260)] bg-[oklch(0.19_0.006_260)]">
            <Lock className="h-5 w-5 text-[oklch(0.74_0.17_160)]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[oklch(0.6_0.01_260)]">
              Scryme Platform
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[oklch(0.96_0.003_260)]">
              Admin Console
            </h1>
          </div>
        </div>

        <div className="border border-[oklch(0.27_0.008_260)] bg-[oklch(0.17_0.006_260)] p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-2 border border-[oklch(0.3_0.03_65)] bg-[oklch(0.22_0.02_65)] px-3 py-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-[oklch(0.75_0.17_65)]" aria-hidden="true" />
            <p className="text-xs leading-snug text-[oklch(0.85_0.02_65)]">
              Restricted access. Super admin credentials required.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[oklch(0.75_0.005_260)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@scryme.tech"
                className="border-[oklch(0.3_0.008_260)] bg-[oklch(0.14_0.006_260)] text-[oklch(0.96_0.003_260)] placeholder:text-[oklch(0.45_0.008_260)]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-[oklch(0.65_0.2_25)]">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[oklch(0.75_0.005_260)]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="border-[oklch(0.3_0.008_260)] bg-[oklch(0.14_0.006_260)] text-[oklch(0.96_0.003_260)] placeholder:text-[oklch(0.45_0.008_260)]"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-[oklch(0.65_0.2_25)]">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 bg-[oklch(0.74_0.17_160)] text-[oklch(0.12_0.005_260)] hover:bg-[oklch(0.7_0.17_160)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[oklch(0.4_0.008_260)]">
          Every action here is audited
        </p>
      </div>
    </div>
  );
}
