import React, { useState } from "react";
import {
  Book,
  PlusCircle,
  Users,
  MapPin,
  Edit,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export default function UserGuides() {
  const [activeTab, setActiveTab] = useState<"intro" | "products" | "members" | "locations">("intro");

  const sidebarItems = [
    { id: "intro", label: "Getting Started", icon: Book },
    { id: "products", label: "Products & Catalog", icon: PlusCircle },
    { id: "members", label: "Members & Staff", icon: Users },
    { id: "locations", label: "Locations & Multi-tenant", icon: MapPin },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[calc(100vh-140px)]">
      {/* Sidebar Navigation */}
      <aside className="md:col-span-1 space-y-2">
        <div className="text-[10px] uppercase tracking-widest font-bold text-brass px-3 mb-4">
          Guide Sections
        </div>
        <div className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-brass/20 text-paper border-l-4 border-brass"
                    : "text-light-text hover:bg-ink-card hover:text-paper"
                }`}
              >
                <Icon size={16} className={isActive ? "text-brass" : "text-light-text/80"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Content Panel */}
      <div className="md:col-span-3 bg-ink-card/30 border border-ink-border rounded-xl p-6 lg:p-8 space-y-6">
        {activeTab === "intro" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <div className="flex items-center gap-2 text-brass text-xs uppercase tracking-wider font-bold mb-1.5">
                <Sparkles size={14} />
                <span>Quick Start</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-paper">
                Welcome to Scryme Ledger Docs
              </h2>
              <p className="text-light-text text-sm mt-2 leading-relaxed">
                Scryme Ledger provides an enterprise-grade multi-tenant POS, Inventory Traceability, CRM, and Catalog management solution. Whether you are running a single-unit artisanal bakery or orchestrating a complex, multi-location logistics network, Scryme organizes your catalog, physical stock, sales, and members in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <PlusCircle size={15} className="text-brass" />
                  <span>Build Your Catalog</span>
                </h3>
                <p className="text-xs text-light-text leading-relaxed">
                  Learn how to register items, define complex pricing, construct hierarchical product/service taxonomies, and customize CMS fields.
                </p>
              </div>

              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <Users size={15} className="text-brass" />
                  <span>Onboard Your Staff</span>
                </h3>
                <p className="text-xs text-light-text leading-relaxed">
                  Establish a zero-trust staffing hierarchy. Configure fine-grained roles, scopes, shifts, and check-in / check-out attendance loops.
                </p>
              </div>
            </div>

            <div className="bg-brass/[0.08] border border-brass/25 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-paper text-xs uppercase tracking-wider text-brass">
                Navigating the Interface
              </h4>
              <p className="text-xs text-light-text leading-relaxed">
                Toggle between the <strong>User Guides</strong> tab to learn how our merchant dashboard organizes workflows, and the <strong>API Reference</strong> tab to view complete specs, interact with our playground sandbox, and configure our stateful client/server TypeScript SDKs.
              </p>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <div className="flex items-center gap-2 text-brass text-xs uppercase tracking-wider font-bold mb-1.5">
                <PlusCircle size={14} />
                <span>Catalog Setup</span>
              </div>
              <h2 className="text-2xl font-extrabold text-paper">
                Creating & Modifying Products
              </h2>
              <p className="text-light-text text-sm mt-1.5 leading-relaxed">
                Your catalog is organized into <strong>Products</strong> (physical catalog merchandise) and <strong>Services</strong> (bookable events or resources).
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <Edit size={15} className="text-brass" />
                  <span>1. Creating a New Product</span>
                </h3>
                <div className="pl-6 text-xs text-light-text space-y-2 leading-relaxed">
                  <p>To register a brand-new inventory product in your system:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Navigate to the <strong>Inventory & Catalog</strong> section inside your Dashboard.</li>
                    <li>Click on the <strong>Create Product</strong> button on the top right.</li>
                    <li>
                      Provide the core properties: <strong>Name</strong>, unique <strong>SKU</strong>, and default <strong>Selling Price</strong>.
                    </li>
                    <li>
                      (Optional) Switch on <strong>Track Inventory</strong>. If enabled, the system will monitor real-time stock levels, batch dates, and warehouse locations.
                    </li>
                    <li>Save the product. It is now instantly available across all POS registers in the network.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <Sliders size={15} className="text-brass" />
                  <span>2. Modifying Existing Items</span>
                </h3>
                <div className="pl-6 text-xs text-light-text space-y-2 leading-relaxed">
                  <p>When catalog requirements evolve, easily modify details:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Product Variants:</strong> Setup custom parameters (sizes, colors, packages) underneath a parent product to maintain consistent inventory tracking.</li>
                    <li><strong>Dynamic Pricing & Rules:</strong> Set location-specific base pricing or configure automatic tax rates depending on the customer's region.</li>
                    <li>
                      <strong>CMS Metadata Enrichment:</strong> Utilize the advanced <strong>customFields</strong> block to define rich description text, SEO page titles/descriptions, and multi-image media galleries.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <div className="flex items-center gap-2 text-brass text-xs uppercase tracking-wider font-bold mb-1.5">
                <Users size={14} />
                <span>HR & Access Controls</span>
              </div>
              <h2 className="text-2xl font-extrabold text-paper">
                Adding & Managing Members
              </h2>
              <p className="text-light-text text-sm mt-1.5 leading-relaxed">
                Establish robust access control for cashiers, bakers, and supervisors. Limit POS capabilities using custom granular roles and scopes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <PlusCircle size={15} className="text-brass" />
                  <span>Onboarding New Members</span>
                </h3>
                <div className="pl-6 text-xs text-light-text space-y-2 leading-relaxed">
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Navigate to the <strong>Staff & HR</strong> portal inside the administrator view.</li>
                    <li>Select the <strong>Invite Member</strong> option.</li>
                    <li>Enter the user's corporate email address and assign an initial <strong>Role Profile</strong> (e.g., Owner, Manager, Cashier, Baker).</li>
                    <li>An secure OIDC invitation link is dispatched instantly. Once accepted, their account maps seamlessly into your Zitadel or local authentication tenant.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <ShieldAlert size={15} className="text-brass" />
                  <span>Configuring custom Roles & Permissions</span>
                </h3>
                <div className="pl-6 text-xs text-light-text space-y-2 leading-relaxed">
                  <p>
                    Rather than assigning generic presets, you can create fully customizable role models:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Create custom role groups under the <strong>Roles & Scopes</strong> management tab.</li>
                    <li>Select specific capabilities such as <code className="bg-ink-bg px-1 rounded font-mono text-paper">inventory:write</code> or <code className="bg-ink-bg px-1 rounded font-mono text-paper">pos:sale</code>.</li>
                    <li>Link members to dedicated shifts and departments to log audit-friendly attendance and clocking operations.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "locations" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <div className="flex items-center gap-2 text-brass text-xs uppercase tracking-wider font-bold mb-1.5">
                <MapPin size={14} />
                <span>Multi-Tenant Operations</span>
              </div>
              <h2 className="text-2xl font-extrabold text-paper">
                Adding & Modifying Locations
              </h2>
              <p className="text-light-text text-sm mt-1.5 leading-relaxed">
                Scryme structures stock around physical location targets, enabling granular audits of warehouse bins, retail shelf counts, and central logistical depots.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <PlusCircle size={15} className="text-brass" />
                  <span>1. Adding a New Location Node</span>
                </h3>
                <div className="pl-6 text-xs text-light-text space-y-2 leading-relaxed">
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to the <strong>Organization Settings</strong> panel.</li>
                    <li>Click on the <strong>Locations</strong> directory.</li>
                    <li>Press the <strong>Add Location</strong> button.</li>
                    <li>Fill out key coordinates: Location Name, physical address, and phone number.</li>
                    <li>Select the target location type (Warehouse, Retail Front, Central Kitchen, or Delivery Partner).</li>
                  </ol>
                </div>
              </div>

              <div className="bg-ink-card border border-ink-border p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-paper text-sm flex items-center gap-2">
                  <Layers size={15} className="text-brass" />
                  <span>2. Modifying stock levels & transfers</span>
                </h3>
                <div className="pl-6 text-xs text-light-text space-y-2 leading-relaxed">
                  <p>Once multiple nodes are live in your network, inventory flow can be managed programmatically:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Stock Transfer Requests:</strong> Initiate digital transfer payloads to securely dispatch wheat flour or physical assets between warehouses and retail shops.</li>
                    <li><strong>Physical Reconciliations:</strong> Run physical cycle audits at specific locations. Input actual counted quantities to automatically reconcile ledger book balances with shelf reality.</li>
                    <li><strong>Traceability:</strong> Trace granular item batches or recipe components to exact location nodes during audit sequences.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
