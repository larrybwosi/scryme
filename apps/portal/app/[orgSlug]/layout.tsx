import { getOrganizationBySlug } from "@/app/lib/org";
import { notFound } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@repo/ui/components/ui/sidebar";
import { LayoutDashboard, BookOpen, ShoppingCart, ReceiptText, Settings } from "lucide-react";
import Link from "next/link";

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: { orgSlug: string } }) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) notFound();

  const navItems = [
    { title: "Dashboard", href: `/${orgSlug}/dashboard`, icon: LayoutDashboard },
    { title: "Catalog", href: `/${orgSlug}/catalog`, icon: BookOpen },
    { title: "Orders", href: `/${orgSlug}/orders`, icon: ReceiptText },
    { title: "Cart", href: `/${orgSlug}/cart`, icon: ShoppingCart },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 flex items-center px-4 border-b">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold mr-2 shrink-0">
              {org.name.charAt(0)}
            </div>
            <h1 className="font-bold text-xl truncate">{org.name}</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Account Settings">
                    <Link href={`/${orgSlug}/account`}>
                      <Settings className="size-4" />
                      <span>Account Settings</span>
                    </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex-1">
              <h2 className="text-sm font-medium">B2B Portal</h2>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/20">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
