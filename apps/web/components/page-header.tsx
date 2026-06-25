import { Plus, MoreHorizontal, Star } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  icon,
  subtitle,
  description,
  action,
  children,
}: PageHeaderProps) {
  const ActionButton = action ? (
    <Button
      asChild={!!action.href}
      onClick={action.onClick}
      className="bg-[#4a9c6d] hover:bg-[#3d825b] text-white shadow-sm">
      {action.href ? (
        <Link href={action.href}>
          {action.icon || <Plus className="w-4 h-4" />}
          {action.label}
        </Link>
      ) : (
        <>
          {action.icon || <Plus className="w-4 h-4" />}
          {action.label}
        </>
      )}
    </Button>
  ) : null;

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 bg-[#2d3731] rounded-xl flex items-center justify-center text-white shadow-lg">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Add to favorites"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                  <Star className="w-5 h-5 text-muted-foreground hover:text-yellow-400 cursor-pointer transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Add to favorites</TooltipContent>
            </Tooltip>
          </div>
          {(subtitle || description) && (
            <p className="text-sm text-muted-foreground">
              {subtitle || description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        {ActionButton}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More options">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>More options</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
