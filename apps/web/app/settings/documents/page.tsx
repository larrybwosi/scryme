import React from 'react';
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { TemplateSelector } from './template-selector';
import { Separator } from '@repo/ui/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { FileText, Settings2, Palette } from 'lucide-react';
import { InvoiceConfigForm } from './invoice-config-form';

export default async function DocumentsSettingsPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    redirect(`/login?callbackUrl=/settings/documents`);
  }

  const [organization, invoiceConfig] = await Promise.all([
    db.organization.findUnique({
      where: { id: auth.organizationId },
      include: {
        settings: true,
      },
    }),
    db.invoiceConfig.findUnique({
      where: { organizationId: auth.organizationId },
    }),
  ]);

  if (!organization) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-bold tracking-tight">Document Settings</h3>
        <p className="text-sm text-muted-foreground">
          Professionalize your business presence with custom document templates and numbering.
        </p>
      </div>
      <Separator className="bg-muted/60" />

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-muted/40 p-1 mb-6">
          <TabsTrigger value="templates" className="flex items-center gap-2 px-6">
            <Palette className="w-4 h-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2 px-6">
            <Settings2 className="w-4 h-4" /> Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 outline-none">
          <div className="flex flex-col gap-1 mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Invoice Templates
            </h4>
            <p className="text-xs text-muted-foreground">
              Select the default template for all generated invoices across the platform.
            </p>
          </div>

          <TemplateSelector
            initialTemplateId={organization.settings?.defaultInvoiceTemplate || 'default'}
            organization={organization}
            invoiceConfig={invoiceConfig}
          />
        </TabsContent>

        <TabsContent value="configuration" className="max-w-3xl outline-none">
          <InvoiceConfigForm initialConfig={invoiceConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
