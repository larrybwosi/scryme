"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { colors } from "@/lib/scryme-tokens";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg animate-pulse bg-current opacity-10" />
    );
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const getIcon = () => {
    if (theme === "dark") {
      return <Moon size={16} className="transition-transform duration-300 rotate-0 scale-100" />;
    }
    if (theme === "light") {
      return <Sun size={16} className="transition-transform duration-300 rotate-0 scale-100" />;
    }
    return <Monitor size={16} className="transition-transform duration-300 scale-100" />;
  };

  const getLabel = () => {
    if (theme === "dark") return "Dark theme active. Click to switch to Light theme.";
    if (theme === "light") return "Light theme active. Click to switch to System theme.";
    return "System theme active. Click to switch to Dark theme.";
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg transition-colors duration-200 border cursor-pointer hover:bg-[rgba(241,233,216,0.06)] hover:border-brass/40"
      style={{
        color: colors.brass,
        borderColor: colors.inkLine,
      }}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
