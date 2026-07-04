import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  WifiOff,
  Printer,
  MonitorSmartphone,
  Zap,
  ShieldCheck,
  Download,
  Monitor,
  Apple,
  Terminal
} from "lucide-react";

export default function PosPage() {
  const features = [
    {
      title: "Offline-First",
      description: "Keep selling even when the internet goes down. Data syncs automatically once reconnected.",
      icon: WifiOff,
    },
    {
      title: "Hardware Integration",
      description: "Native support for thermal printers, barcode scanners, and cash drawers.",
      icon: Printer,
    },
    {
      title: "Multi-Platform",
      description: "High-performance desktop application available for Windows, macOS, and Linux.",
      icon: MonitorSmartphone,
    },
    {
      title: "Real-time Sync",
      description: "Inventory and sales data are synced across all your locations in real-time.",
      icon: Zap,
    },
    {
      title: "Enterprise Security",
      description: "End-to-end encryption and role-based access control for your peace of mind.",
      icon: ShieldCheck,
    }
  ];

  const downloads = [
    { platform: "Windows", version: "v8.4.0", icon: Monitor, arch: "x64 (.exe)", link: "/api/v3/pos/download?platform=windows" },
    { platform: "macOS", version: "v8.4.0", icon: Apple, arch: "Silicon/Intel (.dmg)", link: "/api/v3/pos/download?platform=macos" },
    { platform: "Linux", version: "v8.4.0", icon: Terminal, arch: "AppImage/Deb (.deb)", link: "/api/v3/pos/download?platform=linux" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-(--breakpoint-2xl) mx-auto space-y-8">
      <div className="mt-12 lg:mt-0">
        <h1 className="text-3xl font-bold text-[#1D1D1F]">Scryme POS</h1>
        <p className="text-muted-foreground mt-2">
          High-performance, offline-ready Point of Sale for modern retail.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardHeader>
              <div className="w-10 h-10 bg-[#34A853]/10 rounded-lg flex items-center justify-center mb-2">
                <feature.icon className="text-[#34A853]" size={20} />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Download Binaries</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {downloads.map((download, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary">{download.version}</Badge>
                  <download.icon size={24} className="text-gray-400" />
                </div>
                <CardTitle className="mt-2">{download.platform}</CardTitle>
                <CardDescription>{download.arch}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-[#34A853] hover:bg-[#2d9247]">
                  <a href={download.link}>
                    <Download size={16} className="mr-2" />
                    Download Now
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-[#1D1D1F] text-white border-none overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold">Ready to scale your business?</h2>
            <p className="text-gray-400">
              The Scryme POS application is designed to handle thousands of transactions daily with zero lag.
              Get started by downloading the binary for your platform and signing in with your organization credentials.
            </p>
          </div>
          <div className="shrink-0">
             <div className="w-32 h-32 bg-[#34A853] rounded-2xl rotate-12 flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-6xl -rotate-12">S</span>
             </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
