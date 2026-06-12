'use client';

import React, { useState, useTransition } from 'react';
import { INVOICE_TEMPLATE_METADATA, getInvoiceTemplate, getMockInvoiceData } from '@repo/documents';
import { PDFViewer } from '@react-pdf/renderer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Check, Loader2, Eye, FileText } from 'lucide-react';
import { updateInvoiceTemplate } from '../../actions/organization';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  initialTemplateId: string;
  organization: any;
  invoiceConfig?: any;
}

export function TemplateSelector({
  initialTemplateId,
  organization,
  invoiceConfig,
}: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState(initialTemplateId);
  const [previewId, setPreviewId] = useState(initialTemplateId);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateInvoiceTemplate(selectedId);
        toast.success('Default invoice template updated');
      } catch (error) {
        toast.error('Failed to update template');
      }
    });
  };

  const SelectedTemplateComponent = getInvoiceTemplate(previewId);
  const mockData = getMockInvoiceData({
    name: organization?.name,
    address: organization?.address,
    phone: organization?.phone,
    email: organization?.email,
    logo: organization?.logo,
    invoiceNumber: `${invoiceConfig?.invoicePrefix || "INV-"}${invoiceConfig?.nextInvoiceNumber || "001"}`,
    notes: invoiceConfig?.footerText || "Thank you for your business!",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {INVOICE_TEMPLATE_METADATA.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedId === template.id ? 'border-primary shadow-md' : 'border-transparent hover:border-muted'
              }`}
              onClick={() => setSelectedId(template.id)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-bold">{template.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {template.version}
                    </Badge>
                    {selectedId === template.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewId(template.id);
                  }}
                >
                  <Eye className="mr-1 h-3 w-3" /> Preview
                </Button>
                {selectedId === template.id && (
                   <span className="text-[10px] text-muted-foreground font-medium italic">Selected</span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-4 pt-4 bg-background/80 backdrop-blur-sm">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isPending || selectedId === initialTemplateId}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Default Template
          </Button>
        </div>
      </div>

      <div className="lg:col-span-7 border rounded-lg bg-muted/30 overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 bg-background border-bottom flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Live Preview: {INVOICE_TEMPLATE_METADATA.find(t => t.id === previewId)?.name}</span>
            </div>
            <Badge variant="secondary">Sample Data</Badge>
        </div>
        <div className="flex-1 w-full h-full relative">
            <PDFViewer width="100%" height="100%" className="absolute inset-0 border-none" showToolbar={true}>
                <SelectedTemplateComponent data={mockData} qrCode="https://via.placeholder.com/150" />
            </PDFViewer>
        </div>
      </div>
    </div>
  );
}
