"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Package,
  MapPin,
  ShoppingCart,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  getUserOnboardingStatus,
  updateUserOnboardingStatus,
} from "@/app/actions/user-onboarding";

interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  keyHighlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "org-setup",
    targetSelector: '[data-tour="org-setup"]',
    title: "Welcome & Organization Hub",
    subtitle: "Your multi-tenant operational headquarters",
    badge: "Step 1 of 5",
    description:
      "Manage organization-wide settings, operational document configurations, system integrations, and global business profiles seamlessly from your central hub.",
    icon: Building2,
    gradient: "from-blue-600 to-indigo-600",
    keyHighlights: [
      "Switch active organization contexts instantly",
      "Configure automated billing and document defaults",
      "Manage third-party integrations & webhooks",
    ],
  },
  {
    id: "inventory",
    targetSelector: '[data-tour="inventory"]',
    title: "Products & Inventory Control",
    subtitle: "Master catalog, stock levels & batch tracking",
    badge: "Step 2 of 5",
    description:
      "Full oversight over your product catalog, service items, multi-currency pricelists, stock adjustments, batch expiry dates, and automated reorder rules.",
    icon: Package,
    gradient: "from-emerald-600 to-teal-600",
    keyHighlights: [
      "Track physical stock, categories, & custom units",
      "Manage batch numbers & expiration notifications",
      "Set automated restocking rules & stock transfers",
    ],
  },
  {
    id: "locations",
    targetSelector: '[data-tour="locations"]',
    title: "Locations & Branch Management",
    subtitle: "Multi-outlet, warehouse & zone mapping",
    badge: "Step 3 of 5",
    description:
      "Organize physical stores, distribution warehouses, sub-zones, and retail outlets. Allocate dedicated inventory stock levels to each location effortless.",
    icon: MapPin,
    gradient: "from-amber-600 to-orange-600",
    keyHighlights: [
      "Define physical branch locations & sub-zones",
      "Assign localized devices and POS registers",
      "Transfer stock seamlessly between warehouses",
    ],
  },
  {
    id: "sales",
    targetSelector: '[data-tour="sales"]',
    title: "Sales & POS Operations",
    subtitle: "Real-time transactions, invoices & POS sync",
    badge: "Step 4 of 5",
    description:
      "Monitor incoming sales, process orders, manage deliveries, and synchronize with native Point-of-Sale (POS) desktop terminals across all stores in real time.",
    icon: ShoppingCart,
    gradient: "from-purple-600 to-pink-600",
    keyHighlights: [
      "Live order processing & delivery reconciliation",
      "Automated invoice creation & tax compliance",
      "Direct synchronization with Tauri POS devices",
    ],
  },
  {
    id: "staff",
    targetSelector: '[data-tour="staff"]',
    title: "Team & Staff Permissions",
    subtitle: "Roster scheduling, departments & role access",
    badge: "Step 5 of 5",
    description:
      "Invite team members, assign granular security roles, manage department hierarchies, driver schedules, shift trading, and operational staff tasks.",
    icon: Users,
    gradient: "from-cyan-600 to-blue-600",
    keyHighlights: [
      "Role-based access controls & custom permissions",
      "Shift scheduling, trades, and time tracking",
      "Department management & driver assignment",
    ],
  },
];

interface RectBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SetupGuideTour({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetBounds, setTargetBounds] = useState<RectBounds | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check initial onboarding status
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }

    let isMounted = true;
    async function checkStatus() {
      const res = await getUserOnboardingStatus();
      if (isMounted && res.success && res.data) {
        if (!res.data.completed && !res.data.skipped) {
          setIsOpen(true);
        }
      }
    }
    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [forceOpen]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Measure and update target element bounds
  const updateTargetBounds = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetBounds({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetBounds(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateTargetBounds();
    window.addEventListener("resize", updateTargetBounds);
    window.addEventListener("scroll", updateTargetBounds, true);

    return () => {
      window.removeEventListener("resize", updateTargetBounds);
      window.removeEventListener("scroll", updateTargetBounds, true);
    };
  }, [updateTargetBounds, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    setIsUpdating(true);
    await updateUserOnboardingStatus({ skipped: true });
    setIsUpdating(false);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    await updateUserOnboardingStatus({ completed: true, skipped: false });
    setIsUpdating(false);
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen || !currentStep) return null;

  const IconComponent = currentStep.icon;

  // Calculate popover positioning relative to target element or screen center
  const getPopoverStyle = () => {
    if (!targetBounds) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const margin = 16;
    const popoverWidth = 420;
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    let left = targetBounds.left + targetBounds.width + margin;
    let top = targetBounds.top;

    // Fallback to right side or top/bottom if off-screen
    if (left + popoverWidth > windowWidth - 20) {
      left = Math.max(20, targetBounds.left - popoverWidth - margin);
    }

    if (left < 20) {
      left = Math.max(20, (windowWidth - popoverWidth) / 2);
      top = Math.min(windowHeight - 450, targetBounds.top + targetBounds.height + margin);
    }

    // Keep top within screen boundaries
    top = Math.max(20, Math.min(top, windowHeight - 480));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${Math.min(popoverWidth, windowWidth - 40)}px`,
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
        {/* Darkened backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          onClick={handleSkip}
        />

        {/* Highlight spotlight cutout box around active target element */}
        {targetBounds && (
          <motion.div
            initial={false}
            animate={{
              top: targetBounds.top - 6,
              left: targetBounds.left - 6,
              width: targetBounds.width + 12,
              height: targetBounds.height + 12,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute rounded-xl ring-2 ring-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.5)] bg-transparent pointer-events-none z-[101]"
          />
        )}

        {/* Animated Tour Card Popover */}
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={getPopoverStyle()}
          className="fixed z-[102] bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header Banner with Gradient */}
          <div
            className={`p-5 bg-gradient-to-r ${currentStep.gradient} relative flex items-center justify-between text-white`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-xs font-semibold px-2 py-0.5 mb-1">
                  {currentStep.badge}
                </Badge>
                <h3 className="text-lg font-bold tracking-tight leading-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleSkip}
              disabled={isUpdating}
              className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
              title="Skip setup guide"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 space-y-4 text-sm">
            <p className="text-slate-300 font-medium leading-relaxed">
              {currentStep.description}
            </p>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Key Features
              </span>
              <ul className="space-y-1.5">
                {currentStep.keyHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Overall Progress</span>
                <span>
                  {Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: `${(currentStepIndex / TOUR_STEPS.length) * 100}%` }}
                  animate={{
                    width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isUpdating}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Skip Tour
            </Button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={isUpdating}
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleNext}
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  "Got it, Finish!"
                ) : (
                  <>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
