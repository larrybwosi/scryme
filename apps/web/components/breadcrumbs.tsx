import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span
              className={
                index === items.length - 1 ? "text-foreground font-medium" : ""
              }>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
