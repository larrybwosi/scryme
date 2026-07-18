import { requireSession } from "@/app/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { updateAccount } from "@/app/lib/account-actions";
import { User, Building, Mail, Phone, Save } from "lucide-react";
import { getPortalSDK } from "@/app/lib/portal-sdk";

export default async function AccountPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const session = await requireSession(orgSlug);

  const sdk = await getPortalSDK();
  let customer;
  try {
    customer = await sdk.customers.getCustomer(orgSlug, session.customerId);
  } catch (e) {
    return <div>Error loading customer profile.</div>;
  }

  if (!customer) return <div>Customer not found</div>;

  const updateAccountWithSlug = updateAccount.bind(null, orgSlug);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto text-primary-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and contact information.</p>
      </div>

      <form action={updateAccountWithSlug}>
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>This information will be used for your orders and invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                Contact Name
              </label>
              <Input name="name" defaultValue={customer.name} placeholder="Your full name" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building className="size-4 text-muted-foreground" />
                Company Name
              </label>
              <Input name="company" defaultValue={customer.company || ""} placeholder="Your business name" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  Email Address
                </label>
                <Input type="email" name="email" defaultValue={customer.email || ""} placeholder="business@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  Phone Number
                </label>
                <Input type="tel" name="phone" defaultValue={customer.phone || ""} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 p-4 flex justify-end">
            <Button type="submit">
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Sensitive account actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Once you deactivate your business account, you will lose access to the portal.</p>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20">
            Deactivate Portal Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
