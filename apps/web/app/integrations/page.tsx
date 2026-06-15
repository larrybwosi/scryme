import { Boxes, Key, Webhook, Monitor } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { PageHeader } from "../../components/page-header";

const INTEGRATION_CATEGORIES = [
  {
    title: "Apps & API",
    description:
      "Manage your V3 API clients, V2 keys, and device provisioning.",
    icon: <Key className="w-8 h-8 text-blue-500" />,
    href: "/integrations/apps-api",
  },
  {
    title: "Webhooks",
    description: "Configure and monitor real-time event notifications.",
    icon: <Webhook className="w-8 h-8 text-green-500" />,
    href: "/integrations/apps-api?tab=webhooks",
  },
  {
    title: "Devices",
    description: "Provision and manage POS terminals and other hardware.",
    icon: <Monitor className="w-8 h-8 text-purple-500" />,
    href: "/integrations/apps-api?tab=v2",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <PageHeader
        title="Integrations"
        subtitle="Connect and manage external applications and devices."
        icon={<Boxes className="w-7 h-7" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {INTEGRATION_CATEGORIES.map(category => (
          <Link
            key={category.title}
            href={category.href}
            className="block p-6 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
            <div className="mb-4">{category.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600">
              {category.title}
            </h3>
            <p className="text-sm text-gray-500">{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
