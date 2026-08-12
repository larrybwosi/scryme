import React, { useState } from "react";
import {
  Key,
  Shield,
  UserCheck,
  RefreshCw,
  Layers,
  UserPlus,
  BookOpen,
  Edit,
  Trash2,
  ShoppingCart,
  Merge,
  CreditCard,
  Code,
  ArrowRight,
  Database,
  Check,
} from "lucide-react";

interface GuideProps {
  renderHighlightedCode: (code: string, language: string) => React.ReactNode;
}

export default function CustomerAuthGuide({ renderHighlightedCode }: GuideProps) {
  const [activeSubTab, setActiveSubTab] = useState<"auth" | "crud" | "cart">("auth");
  const [activeCrudSubTab, setActiveCrudSubTab] = useState<"create" | "read" | "update" | "delete">("create");

  // --- Auth Code Snippets ---
  const credentialsLoginCode = `// Authenticating using standard credentials via SDK (Client-Side)
import { ScrymeClientSDK } from '@scryme/sdk/client';

const scryme = new ScrymeClientSDK({
  clientId: "your_client_id_abc",
  orgSlug: "bakery-co",
});

try {
  const response = await scryme.customer.auth.signIn({
    email: "alice.smith@example.com",
    password: "securepassword123",
  });

  // The SDK automatically saves the bearer token and injects it to subsequent requests!
  console.log("Customer session token:", response.token);
  console.log("Customer user details:", response.user);
} catch (error) {
  console.error("Sign-in failed:", error);
}`;

  const oidcLoginCode = `// Exchanging Zitadel/Federated Google token for a Scryme session token
try {
  const response = await scryme.customer.auth.swapZitadel("zitadel_oidc_access_token_xyz");
  console.log("Zitadel identity successfully swapped!", response.user);
} catch (error) {
  console.error("Token swap failed:", error);
}`;

  const proactiveRefreshCode = `// Proactive SDK Token Expiration Interceptor
// If the JWT expires in < 30 seconds, the client automatically requests a session refresh!
scryme.axiosInstance.interceptors.request.use(async (config) => {
  const session = await scryme.customer.auth.getSession();
  if (session.expiresAt && Date.now() >= session.expiresAt - 30000) {
    console.log("Token expiring soon. Executing background refresh...");
    await scryme.customer.auth.refreshSession();
  }
  return config;
});`;


  // --- Customer CRUD Code Snippets ---

  // CREATE Snippets
  const createApiRequest = `POST /v3/bakery-co/customers/register
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+254712345678",
  "company": "Smith Baking Co.",
  "customerType": "B2B_PREMIUM",
  "dateOfBirth": "1992-08-24",
  "taxId": "PIN-KRA-12345",
  "address": {
    "label": "Office Headquarters",
    "street1": "Westlands Commercial Block",
    "city": "Nairobi",
    "country": "Kenya",
    "isDefault": true
  }
}`;

  const createApiResponse = `{
  "success": true,
  "timestamp": "2026-08-05T12:00:00.000Z",
  "data": {
    "id": "cust_smith456",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+254712345678",
    "company": "Smith Baking Co.",
    "customerType": "B2B_PREMIUM",
    "dateOfBirth": "1992-08-24",
    "taxId": "PIN-KRA-12345"
  }
}`;

  const createSdkCode = `// Client-Side customer registration (SDK)
import { ScrymeClientSDK } from '@scryme/sdk/client';

const scryme = new ScrymeClientSDK({
  clientId: "storefront_app",
  orgSlug: "bakery-co"
});

const result = await scryme.customer.auth.signUp({
  name: "Jane Smith",
  email: "jane.smith@example.com",
  password: "securepassword456", // Establishes login credentials
  phone: "+254712345678",
  company: "Smith Baking Co.",
  customerType: "B2B_PREMIUM"
});

console.log("Customer signed up successfully!", result.data);`;


  // READ Snippets
  const readApiRequest = `GET /v3/bakery-co/customers/cust_smith456`;

  const readApiResponse = `{
  "success": true,
  "timestamp": "2026-08-05T12:05:00.000Z",
  "data": {
    "id": "cust_smith456",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+254712345678",
    "company": "Smith Baking Co.",
    "customerType": "B2B_PREMIUM",
    "createdAt": "2026-08-05T12:00:00.000Z"
  }
}`;

  const readSdkCode = `// 1. Resolve logged-in customer's profile directly
const profile = await scryme.customer.getProfile();
console.log("Logged-in customer name:", profile.name);

// 2. Fetch specific customer details by ID (requires administrative scopes)
const response = await scryme.admin.getCustomerById("cust_smith456");
console.log("Fetched Customer Profile:", response.data);`;


  // UPDATE Snippets
  const updateApiRequest = `PATCH /v3/bakery-co/customers/cust_smith456
Content-Type: application/json

{
  "name": "Jane Smith-Johnson",
  "phone": "+254799999999",
  "company": "Smith & Johnson Bakers Ltd"
}`;

  const updateApiResponse = `{
  "success": true,
  "timestamp": "2026-08-05T12:10:00.000Z",
  "data": {
    "id": "cust_smith456",
    "name": "Jane Smith-Johnson",
    "email": "jane.smith@example.com",
    "phone": "+254799999999",
    "company": "Smith & Johnson Bakers Ltd",
    "customerType": "B2B_PREMIUM"
  }
}`;

  const updateSdkCode = `// Update profile details for the currently logged-in customer
const response = await scryme.customer.updateProfile({
  name: "Jane Smith-Johnson",
  phone: "+254799999999",
  company: "Smith & Johnson Bakers Ltd"
});

console.log("Updated active session profile:", response.data);`;


  // DELETE Snippets
  const deleteApiRequest = `DELETE /v3/bakery-co/customers/cust_smith456`;

  const deleteApiResponse = `{
  "success": true,
  "timestamp": "2026-08-05T12:15:00.000Z",
  "data": {
    "success": true,
    "message": "Customer deleted successfully"
  }
}`;

  const deleteSdkCode = `// Mark customer as cascade-safely deactivated or deleted (Admin SDK)
const response = await scryme.admin.deleteCustomer("cust_smith456");

// Handled gracefully: soft deactivation takes effect if relational database
// constraints (like historical sales or active booking items) are linked!
console.log("Deactivation outcome message:", response.data.message);`;


  // --- Cart Code Snippets ---
  const guestCartCode = `// 1. Interactive Shopping Cart Management (Guest mode)
const sessionId = "browser_temp_session_12345";

// Add product variant or bookable service to cart
await scryme.orders.addToCart({
  productId: "prod_masterclass_bread",
  variantId: "var_round_sourdough",
  quantity: 2,
  sessionId: sessionId // Associated with unique guest identifier
});

// Update or explicitly set item quantities (with auto-removal on <= 0)
await scryme.cart.update({
  productId: "prod_masterclass_bread",
  variantId: "var_round_sourdough",
  quantity: 1, // Decrement quantity down to 1
  sessionId: sessionId
});`;

  const cartMergeCode = `// 2. Seamless Guest-to-Customer Cart Deep-Merging
// Upon logging in, pass the guest sessionId to the Cart Retrieval method.
// The backend will combine quantities, migrate products, and clear the stale guest cart.

const session = await scryme.customer.auth.signIn({
  email: "customer@gmail.com",
  password: "securepassword"
});

// Execute the merge on the backend by querying the cart using both authenticated JWT & guest sessionId
const mergedCart = await scryme.cart.get({
  sessionId: "browser_temp_session_12345" // Triggers backend merge!
});

console.log("Fully aggregated customer cart items count:", mergedCart.data.items.length);`;

  const checkoutCode = `// 3. Programmatic Checkout & Sales Order Generation
try {
  const order = await scryme.cart.checkout({
    locationId: "loc_nairobi_warehouse", // Source warehouse for stock deduction
    notes: "Please deliver to the corporate kitchen.",
    channel: "ONLINE_STOREFRONT"
  });

  console.log("Order generated successfully!", order.id);
  console.log("Total checkout amount:", order.totalAmount);
} catch (error) {
  console.error("Checkout failed:", error.message);
}`;

  return (
    <div className="space-y-8 max-w-4xl text-left">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] text-light-text/70 font-medium">
          <span>Guides</span>
          <span className="text-brass">/</span>
          <span className="text-paper">Customer & Cart Developer Portal</span>
        </div>
        <h1 className="text-[28px] font-bold text-paper leading-[1.15] tracking-tight">
          Customer & Cart Operations Reference
        </h1>
        <p className="text-light-text text-[14px] leading-relaxed">
          Build rich, high-fidelity headless storefronts, custom CRM integrations, and checkouts.
          This portal covers customer authentication, secure lifecycle (CRUD) controls, and stateful shopping carts using both raw REST endpoints and the stateful `@scryme/sdk`.
        </p>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-ink-border">
        {[
          { id: "auth", label: "1. Authentication Methods", icon: Key },
          { id: "crud", label: "2. Customer CRUD Actions", icon: UserPlus },
          { id: "cart", label: "3. Shopping Cart & Checkout", icon: ShoppingCart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer ${
                isActive
                  ? "border-brass text-paper bg-brass/[0.04]"
                  : "border-transparent text-light-text hover:text-paper"
              }`}
            >
              <Icon size={14} className={isActive ? "text-brass" : "text-light-text"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeSubTab === "auth" && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-ink-card/50 border border-ink-border p-4 rounded-xl space-y-2">
              <div className="text-brass flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                <UserCheck size={14} />
                <span>Local Credentials</span>
              </div>
              <p className="text-light-text text-xs leading-relaxed">
                Register and log in customers using passwords securely hashed on the backend. Highly optimized for classic email registration flows.
              </p>
            </div>
            <div className="bg-ink-card/50 border border-ink-border p-4 rounded-xl space-y-2">
              <div className="text-brass flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                <Layers size={14} />
                <span>OIDC Federated Login</span>
              </div>
              <p className="text-light-text text-xs leading-relaxed">
                Coordinate authentication with Google Social or Zitadel OIDC identities, then exchange provider assertions for local JWT sessions.
              </p>
            </div>
            <div className="bg-ink-card/50 border border-ink-border p-4 rounded-xl space-y-2">
              <div className="text-brass flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                <Shield size={14} />
                <span>Auto-Refresh Tokens</span>
              </div>
              <p className="text-light-text text-xs leading-relaxed">
                The SDK maintains reactive middleware interceptors that refresh expiring customer login sessions seamlessly in the background.
              </p>
            </div>
          </div>

          {/* Email / Credentials Flow */}
          <div className="space-y-4">
            <h2 className="text-md font-bold text-paper border-b border-ink-border/50 pb-1.5 flex items-center gap-2">
              <Key size={16} className="text-brass" />
              <span>Standard Local Credentials Login</span>
            </h2>
            <p className="text-light-text text-xs leading-relaxed">
              Storefront applications trigger credential authentication using the `signIn` wrapper. Upon successful email/password validation, the backend generates an active session and signs a standard `HS256` Bearer JWT containing customer context.
            </p>
            <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
              {renderHighlightedCode(credentialsLoginCode, "node")}
            </div>
          </div>

          {/* Zitadel / OIDC Flow */}
          <div className="space-y-4">
            <h2 className="text-md font-bold text-paper border-b border-ink-border/50 pb-1.5 flex items-center gap-2">
              <Merge size={16} className="text-brass" />
              <span>OIDC Token Swap Federated Flow</span>
            </h2>
            <p className="text-light-text text-xs leading-relaxed">
              If your client completes Google Social Sign-In or another federated authentication via Zitadel, you can exchange their external OpenID token for a local Scryme Customer session token using `swapZitadel`.
            </p>
            <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
              {renderHighlightedCode(oidcLoginCode, "node")}
            </div>
          </div>

          {/* Background Refresh */}
          <div className="space-y-4">
            <h2 className="text-md font-bold text-paper border-b border-ink-border/50 pb-1.5 flex items-center gap-2">
              <RefreshCw size={16} className="text-brass" />
              <span>Auto-Refresh & Request Interceptors</span>
            </h2>
            <p className="text-light-text text-xs leading-relaxed">
              Developers can rest easy knowing the `@scryme/sdk` implements automatic refresh tokens. Before releasing requests, it checks the token's remaining lifespan. If it's less than 30 seconds, it triggers a quiet swap in the background.
            </p>
            <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
              {renderHighlightedCode(proactiveRefreshCode, "node")}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "crud" && (
        <div className="space-y-8 animate-fade-in">
          <p className="text-light-text text-xs leading-relaxed">
            The Scryme V3 engine exposes complete CRUD endpoints for maintaining customer profiles. Below, toggle between operations to view parallel code listings comparing raw REST API payloads with type-safe SDK executions.
          </p>

          {/* Crud Sub-tab controllers */}
          <div className="flex gap-2 p-1 bg-ink-card/60 border border-ink-border rounded-lg max-w-sm">
            {(["create", "read", "update", "delete"] as const).map((crudType) => (
              <button
                key={crudType}
                onClick={() => setActiveCrudSubTab(crudType)}
                className={`flex-1 py-1 px-3 text-xs font-bold rounded cursor-pointer capitalize transition-all ${
                  activeCrudSubTab === crudType
                    ? "bg-brass text-ink-bg shadow"
                    : "text-light-text hover:text-paper"
                }`}
              >
                {crudType}
              </button>
            ))}
          </div>

          {/* CREATE TAB */}
          {activeCrudSubTab === "create" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-paper flex items-center gap-1.5">
                  <UserPlus size={16} className="text-brass" />
                  <span>Creating Customer Profiles</span>
                </h3>
                <p className="text-light-text text-xs leading-relaxed">
                  Allows customers to self-register via storefronts (with optional core fields like `company` and `taxId`), or allows administrators to provision customer models on behalf of corporate partners.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* REST API column */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    REST API (POST)
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96">
                    {renderHighlightedCode(createApiRequest, "curl")}
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider mt-2 block">
                    Response
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48">
                    {renderHighlightedCode(createApiResponse, "json")}
                  </div>
                </div>

                {/* SDK Column */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    TypeScript SDK Code
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[500px]">
                    {renderHighlightedCode(createSdkCode, "node")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* READ TAB */}
          {activeCrudSubTab === "read" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-paper flex items-center gap-1.5">
                  <BookOpen size={16} className="text-brass" />
                  <span>Retrieving Profile Information</span>
                </h3>
                <p className="text-light-text text-xs leading-relaxed">
                  Look up registered profiles using unique database customer IDs, paginated listings, or easily fetch the active customer's current session profile.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    REST API (GET)
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto">
                    {renderHighlightedCode(readApiRequest, "curl")}
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider mt-2 block">
                    Response
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-64">
                    {renderHighlightedCode(readApiResponse, "json")}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    TypeScript SDK Code
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto">
                    {renderHighlightedCode(readSdkCode, "node")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UPDATE TAB */}
          {activeCrudSubTab === "update" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-paper flex items-center gap-1.5">
                  <Edit size={16} className="text-brass" />
                  <span>Updating Profile Attributes</span>
                </h3>
                <p className="text-light-text text-xs leading-relaxed">
                  Customers can securely extend or modify their personal information (including phone number, company organization, and Kenyan tax KRA PINs).
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    REST API (PATCH)
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96">
                    {renderHighlightedCode(updateApiRequest, "curl")}
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider mt-2 block">
                    Response
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-64">
                    {renderHighlightedCode(updateApiResponse, "json")}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    TypeScript SDK Code
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto">
                    {renderHighlightedCode(updateSdkCode, "node")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DELETE TAB */}
          {activeCrudSubTab === "delete" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-paper flex items-center gap-1.5">
                  <Trash2 size={16} className="text-brass" />
                  <span>Cascade-Safe Profile Deactivation</span>
                </h3>
                <p className="text-light-text text-xs leading-relaxed">
                  If customer records are bound to historical transactions or bookings, the engine bypasses hard SQL deletion constraint errors. It soft-deactivates login sessions and locks the record securely while keeping reporting pipelines correct.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    REST API (DELETE)
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto">
                    {renderHighlightedCode(deleteApiRequest, "curl")}
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider mt-2 block">
                    Response
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48">
                    {renderHighlightedCode(deleteApiResponse, "json")}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-brass tracking-wider">
                    TypeScript SDK Code
                  </span>
                  <div className="relative group bg-ink-bg p-3 rounded-lg border border-ink-border text-[11px] font-mono leading-relaxed overflow-x-auto">
                    {renderHighlightedCode(deleteSdkCode, "node")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "cart" && (
        <div className="space-y-8 animate-fade-in">
          {/* Executive Cart Intro */}
          <div className="bg-brass/[0.04] border border-brass/20 rounded-xl p-4 text-xs leading-relaxed space-y-2">
            <h3 className="font-bold text-paper flex items-center gap-1.5">
              <ShoppingCart size={14} className="text-brass" />
              <span>Stateful Storefront Shopping Carts</span>
            </h3>
            <p className="text-light-text">
              The shopping cart accommodates both anonymous guest shopping and authenticated checkout sequences. Anonymous guest selections are stored with a unique `sessionId` string. Authenticated baskets resolve directly to internal customer profiles.
            </p>
          </div>

          {/* Cart CRUD Operations */}
          <div className="space-y-4">
            <h2 className="text-md font-bold text-paper border-b border-ink-border/50 pb-1.5 flex items-center gap-2">
              <Code size={16} className="text-brass" />
              <span>Cart Mutations & Incremental Delta Updates</span>
            </h2>
            <p className="text-light-text text-xs leading-relaxed">
              Storefronts can add variants to carts, retrieve totals, or update line quantities. The SDK's specialized `cart.update` helper intelligently figures out difference deltas behind the scenes to perform optimal increment commands on NestJS.
            </p>
            <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
              {renderHighlightedCode(guestCartCode, "node")}
            </div>
          </div>

          {/* Cart Session Merging */}
          <div className="space-y-4">
            <h2 className="text-md font-bold text-paper border-b border-ink-border/50 pb-1.5 flex items-center gap-2">
              <Merge size={16} className="text-brass" />
              <span>Backend Guest-to-Customer Deep Merging</span>
            </h2>
            <p className="text-light-text text-xs leading-relaxed">
              When a guest logs in, developers can retrieve their profile and trigger deep merging. Scryme's write transaction block pulls the guest selections (keyed by `guestSessionId`), aggregates overlapping product/variant quantities into the customer's permanent cart, and wipes out the stale temporary guest cart.
            </p>
            <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
              {renderHighlightedCode(cartMergeCode, "node")}
            </div>
          </div>

          {/* Checkout flow */}
          <div className="space-y-4">
            <h2 className="text-md font-bold text-paper border-b border-ink-border/50 pb-1.5 flex items-center gap-2">
              <CreditCard size={16} className="text-brass" />
              <span>Programmatic Multi-Location Checkout</span>
            </h2>
            <p className="text-light-text text-xs leading-relaxed">
              Once ready, direct the SDK to checkout. It converts the stateful cart items into an official enterprise Sales Order, automatically reserves or deducts inventory levels at the target dispatch location, and wipes out the checkout shopping basket.
            </p>
            <div className="relative group bg-ink-bg p-4 rounded-xl border border-ink-border text-xs font-mono">
              {renderHighlightedCode(checkoutCode, "node")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
