import { prisma as db } from '@repo/db';
import { Mappers } from '@repo/documents/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';

const templateCache = new Map<string, any>();

async function getTemplate(name: string, importPath: string) {
  if (templateCache.has(name)) {
    return templateCache.get(name);
  }
  const module = await import(importPath);
  const template = module[name];
  templateCache.set(name, template);
  return template;
}

export async function generateDocument(type: string, data: any): Promise<any> {
  return Buffer.from([]);
}

export async function getDocumentStream(
  type: 'invoice' | 'waybill' | 'receipt' | 'quote',
  id: string,
  orgId?: string,
  format: 'A4' | '80MM' | '58MM' = 'A4',
  template?: string
): Promise<{ stream: NodeJS.ReadableStream; filename: string; contentType: string }> {
  const transaction = await db.transaction.findFirst({
    where: {
      id,
      organizationId: orgId,
    },
    include: {
      organization: {
        include: {
          settings: true,
        },
      },
      customer: {
        include: {
          addresses: true,
        },
      },
      items: true,
      payments: true,
      location: true,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  let DocumentComponent: React.ComponentType<any>;
  let data: any;
  let filename: string;

  switch (type) {
    case 'invoice':
      DocumentComponent = await getTemplate('InvoiceTemplate', '@repo/documents/v2/InvoiceTemplate');
      data = Mappers.toInvoiceData(transaction);
      filename = `Invoice_${transaction.number}.pdf`;
      break;
    case 'receipt':
      DocumentComponent = await getTemplate('ReceiptTemplate', '@repo/documents/v2/ReceiptTemplate');
      data = Mappers.toReceiptData(transaction);
      filename = `Receipt_${transaction.number}.pdf`;
      break;
    default:
      throw new Error(`Document type ${type} not supported yet`);
  }

  const stream = await renderToStream(
    React.createElement(DocumentComponent, { data, settings: transaction.organization?.settings })
  );

  return {
    stream,
    filename,
    contentType: 'application/pdf',
  };
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
}

export enum DocumentFormat {
  PDF = 'PDF',
  HTML = 'HTML',
}
