import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import * as Templates from './index';

// Helper to render a PDF component to a buffer to verify it works
const verifyRender = async (element: React.ReactElement<DocumentProps>) => {
  const buffer = await renderToBuffer(element);
  expect(buffer).toBeDefined();
  expect(buffer.length).toBeGreaterThan(0);
};

describe('Document Generation', () => {
  describe('V2 Templates', () => {
    it('renders InvoiceTemplate correctly', async () => {
      const data: any = {
        invoiceNumber: 'INV-001',
        status: 'PAID',
        date: '2023-10-01',
        customerName: 'John Doe',
        organizationName: 'Scryme Bakery',
        company: { name: 'Scryme Bakery', address: 'Bakery Ave' },
        client: { name: 'John Doe', email: 'john@doe.com', address: 'Street 1' },
        items: [
          { itemCode: 'B-001', itemName: 'Croissant', quantity: 2, rate: 2.5, amount: 5.0 }
        ],
        subtotal: 5.0,
        tax: 0.8,
        total: 5.8,
        payment: { terms: 'COD', availableMethods: ['CASH'] }
      };
      await verifyRender(<Templates.InvoiceTemplate data={data} />);
    });

    it('renders ReceiptTemplateV2 correctly', async () => {
      const data: Templates.ReceiptPDFDataV2 = {
        receiptNumber: 'REC-001',
        transactionId: 'TXN-001',
        date: '2023-10-01',
        customerName: 'John Doe',
        organizationName: 'Scryme Bakery',
        items: [
          { itemName: 'Croissant', quantity: 2, rate: 2.5, amount: 5.0 }
        ],
        subtotal: 5.0,
        taxTotal: 0,
        discountTotal: 0,
        finalTotal: 5.0,
        paymentMethod: 'CASH'
      };
      await verifyRender(<Templates.ReceiptTemplateV2 data={data} />);
    });

    it('renders StockRequestTemplate correctly', async () => {
      const data: Templates.StockRequestPDFData = {
        requestNumber: 'REQ-001',
        status: 'PENDING',
        priority: 'HIGH',
        requestDate: '2023-10-01',
        fromLocation: 'Main Store',
        toLocation: 'Downtown Branch',
        requestedBy: 'Alice',
        items: [
          { sku: 'FL-001', productName: 'Flour', variantName: 'All-purpose', quantity: 10 }
        ],
        organizationName: 'Scryme Bakery'
      };
      await verifyRender(<Templates.StockRequestTemplate data={data} />);
    });

    it('renders StockTransferTemplate correctly', async () => {
      const data: Templates.StockTransferPDFData = {
        transferNumber: 'TRF-001',
        status: 'COMPLETED',
        requestedDate: '2023-10-01',
        fromLocation: 'Main Store',
        toLocation: 'Downtown Branch',
        requestedBy: 'Alice',
        shippedBy: 'Bob',
        receivedBy: 'Charlie',
        items: [
          { sku: 'FL-001', productName: 'Flour', variantName: 'All-purpose', requestedQuantity: 10 }
        ],
        organizationName: 'Scryme Bakery'
      };
      await verifyRender(<Templates.StockTransferTemplate data={data} />);
    });
  });

  describe('V1 Templates', () => {
     it('renders SimpleInvoicePDF correctly', async () => {
        const data: any = {
            invoiceNumber: '123',
            date: '2023-01-01',
            company: { name: 'Org', address: 'Addr', phone: '123', email: 'a@b.com' },
            client: { name: 'Client', address: 'Addr', email: 'c@d.com' },
            items: [{ description: 'Item', qty: 1, unitPrice: 10, amount: 10 }],
            currencySymbol: '$',
            subtotal: 10,
            tax: 1,
            total: 11,
            notes: 'Notes',
            payment: { terms: 'COD' }
        };
        // Needs qrCode prop too
        await verifyRender(<Templates.SimpleInvoicePDF data={data} />);
     });

     it('renders BatchProductionForm correctly', async () => {
        await verifyRender(<Templates.BatchProductionForm batchId="B1" />);
     });
  });
});
