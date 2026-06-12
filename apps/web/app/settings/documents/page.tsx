import React from 'react';
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { TemplateSelector } from './template-selector';
import { Separator } from '@repo/ui/components/ui/separator';

export default async function DocumentsSettingsPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    redirect('/login');
  }

  const organization = await db.organization.findUnique({
    where: { id: auth.organizationId },
    include: {
      settings: true,
    },
  });

  if (!organization) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Document Settings</h3>
        <p className="text-sm text-muted-foreground">
          Choose and customize how your business documents look.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium">Invoice Template</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Select the default template for all generated invoices. This will affect API, POS, and Dashboard exports.
          </p>

          <TemplateSelector
            initialTemplateId={organization.settings?.defaultInvoiceTemplate || 'default'}
            organization={organization}
          />
        </div>
      </div>
    </div>
  );
}
