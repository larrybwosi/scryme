"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Shield,
  Briefcase,
  Globe,
  ChevronRight,
  Mail,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import slugify from "slugify";
import { toast } from "sonner";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  createOrganization,
  checkSlugAvailability,
} from "@/actions/organization";
import {
  getPendingInvitations,
  acceptInvitationByToken,
} from "@/actions/invitations";

// Re-using the schema but focusing on what we need for the simple flow
const createOrgFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(30, "Slug must not exceed 30 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  industry: z.string().min(1, "Please select an industry"),
  size: z.string().min(1, "Please select company size"),
});

type CreateOrgFormData = z.infer<typeof createOrgFormSchema>;

const industries = [
  "Retail",
  "Wholesale",
  "Manufacturing",
  "Services",
  "Food & Beverage",
  "Technology",
  "Healthcare",
  "Education",
  "Construction",
  "Other",
];

const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501+ employees",
];

// Logos and Components re-used from SignUp for consistency
const DealioLogo = () => (
  <div className="flex items-center gap-1">
    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
      <span className="text-white font-black text-xs tracking-tight">D</span>
    </div>
    <span className="text-xl font-bold tracking-tight text-gray-900">
      deal<span className="text-emerald-600">io</span>
    </span>
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col">
    <span className="text-2xl font-bold text-white">{value}</span>
    <span className="text-xs text-emerald-200 mt-0.5">{label}</span>
  </div>
);

export default function CreateOrgPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  interface Invitation {
    id: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
      description: string | null;
    };
    token: string;
    inviter: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgFormSchema),
    mode: "onChange",
  });

  const orgName = watch("name");
  const orgSlug = watch("slug");

  // Fetch pending invitations on mount
  useEffect(() => {
    async function loadInvitations() {
      try {
        const res = await getPendingInvitations();
        if (res.success && res.data) {
          setInvitations(res.data);
          if (res.data.length === 0) {
            setShowForm(true);
          }
        } else {
          setShowForm(true);
        }
      } catch (error) {
        console.error("Failed to load invitations:", error);
        setShowForm(true);
      } finally {
        setLoadingInvitations(false);
      }
    }
    loadInvitations();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (orgName && !showForm) return; // Only auto-generate if form is visible and we have a name
    if (orgName) {
      const generatedSlug = slugify(orgName, {
        lower: true,
        strict: true,
        trim: true,
      });
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [orgName, setValue, showForm]);

  // Check slug availability
  useEffect(() => {
    if (!orgSlug || orgSlug.length < 2) {
      setSlugStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      const isAvailable = await checkSlugAvailability(orgSlug);
      setSlugStatus(isAvailable ? "available" : "taken");
    }, 500);

    return () => clearTimeout(timer);
  }, [orgSlug]);

  const onSubmit = async (data: CreateOrgFormData) => {
    if (slugStatus === "taken") {
      toast.error("This slug is already taken. Please choose another one.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createOrganization(data);
      toast.success("Organization created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (invitation: Invitation) => {
    setIsLoading(true);
    try {
      toast.info("Accepting invitation...");
      const res = await acceptInvitationByToken(invitation.token);
      if (res.success) {
        toast.success("Invitation accepted!");
        router.push("/dashboard");
      } else {
        toast.error(res.error || "Failed to accept invitation");
      }
    } catch (error) {
      toast.error("Failed to accept invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-120">
          {/* Header */}
          <div className="mb-10">
            <DealioLogo />
          </div>

          {!showForm && !loadingInvitations && invitations.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  You&#39;ve been invited!
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  You have {invitations.length} pending invitation
                  {invitations.length > 1 ? "s" : ""} to join existing
                  organizations.
                </p>
              </div>

              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="group relative p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-emerald-600 font-bold shadow-sm group-hover:border-emerald-100 relative overflow-hidden">
                        {inv.organization.logo ? (
                          <Image
                            src={inv.organization.logo}
                            alt={inv.organization.name}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          inv.organization.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {inv.organization.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          Invited by {inv.inviter.name || inv.inviter.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                        onClick={() => handleAcceptInvite(inv)}
                      >
                        Join <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-medium">
                    Or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200 hover:border-emerald-600 hover:text-emerald-600 transition-all group"
                onClick={() => setShowForm(true)}
              >
                Create my own organization
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "space-y-8",
                !loadingInvitations &&
                  "animate-in fade-in slide-in-from-bottom-4 duration-500",
              )}
            >
              {loadingInvitations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-sm text-gray-500 mt-4 font-medium">
                    Setting up your workspace...
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight tracking-tight">
                      Setup your organization
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                      Let&#39;s get your business workspace ready in seconds.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Organization Name */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        Organization Name
                      </label>
                      <Input
                        {...register("name")}
                        placeholder="Acme Corp"
                        className={cn(
                          "h-12 rounded-xl border-gray-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500",
                          errors.name &&
                            "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500",
                        )}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        Workspace URL
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium border-r border-gray-100 pr-3">
                          dealio.io/
                        </div>
                        <Input
                          {...register("slug")}
                          placeholder="acme-corp"
                          className={cn(
                            "h-12 pl-[85px] rounded-xl border-gray-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500",
                            errors.slug &&
                              "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500",
                          )}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {slugStatus === "checking" && (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          )}
                          {slugStatus === "available" && (
                            <Check className="h-4 w-4 text-emerald-500" />
                          )}
                          {slugStatus === "taken" && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        {errors.slug ? (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            {errors.slug.message}
                          </p>
                        ) : slugStatus === "taken" ? (
                          <p className="text-xs text-red-500 font-medium mt-1">
                            This URL is already taken
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">
                            This will be your unique workspace address.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Industry & Size Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-emerald-600" />
                          Industry
                        </label>
                        <Select
                          onValueChange={(val) =>
                            setValue("industry", val, { shouldValidate: true })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((ind) => (
                              <SelectItem key={ind} value={ind}>
                                {ind}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-600" />
                          Team Size
                        </label>
                        <Select
                          onValueChange={(val) =>
                            setValue("size", val, { shouldValidate: true })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizes.map((sz) => (
                              <SelectItem key={sz} value={sz}>
                                {sz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={
                          isLoading || !isValid || slugStatus === "taken"
                        }
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:shadow-none"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Launching workspace...
                          </>
                        ) : (
                          <>
                            Create Organization
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                      Default settings: KES · Kenya · Africa/Nairobi · 16% VAT
                    </p>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Trust badge */}
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5 text-gray-300" />
            <span>Enterprise-grade security · ISO 27001 compliant</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Re-used from SignUp) ── */}
      <div className="hidden lg:flex flex-1 bg-[#0d3d2b] text-white relative overflow-hidden flex-col justify-between p-12">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-emerald-500/10 blur-[70px] pointer-events-none" />

        <div className="relative z-10 space-y-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">
              Ready to scale your business
            </span>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              One platform for
              <br />
              your entire operation.
            </h2>

            <div className="space-y-4">
              {[
                {
                  title: "Unified Dashboard",
                  desc: "Real-time visibility across all branches and locations.",
                },
                {
                  title: "Tax Compliance",
                  desc: "Automated VAT/GST calculations and KRA integration.",
                },
                {
                  title: "Inventory Intelligence",
                  desc: "Advanced stock tracking with FEFO/FIFO/LIFO support.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-emerald-100/60 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-12 pt-8 border-t border-white/10">
          <StatCard value="2.4k+" label="Businesses" />
          <StatCard value="99.9%" label="Uptime" />
          <StatCard value="24/7" label="Expert support" />
        </div>
      </div>
    </div>
  );
}
