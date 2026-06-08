import { Plus, MoreHorizontal, Star } from "lucide-react";
import React from "react";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
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
            <Star className="w-5 h-5 text-muted-foreground hover:text-yellow-400 cursor-pointer transition-colors" />
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
        {action && (
          <button className="flex items-center gap-2 px-4 py-2 bg-[#4a9c6d] text-white rounded-lg text-sm font-semibold hover:bg-[#3d825b] transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
        <button className="p-2 bg-white border border-border rounded-lg hover:bg-muted transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
