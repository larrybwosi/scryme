"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BlogNavbar } from "@/components/layout/blog-navbar";
import { BlogFooter } from "@/components/layout/blog-footer";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBlog = pathname?.startsWith("/blog");
  const isStudio = pathname?.startsWith("/studio");

  if (isStudio) {
    return <>{children}</>;
  }

  if (isBlog) {
    return (
      <>
        <BlogNavbar />
        {children}
        <BlogFooter />
      </>
    );
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
