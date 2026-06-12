import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import * as Templates from './index';

// We can't easily inspect the PDF content (it's binary),
// but we can verify that passing the branding props doesn't crash
// and potentially mock the internal components to see if they receive the props.

vi.mock('./v2/PDFComponents', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    PDFHeader: vi.fn(actual.PDFHeader),
    PDFFooter: vi.fn(actual.PDFFooter),
  };
});

import { PDFHeader, PDFFooter } from './v2/PDFComponents';

describe('V2 Customization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes branding data to PDFHeader and PDFFooter in InvoiceTemplate', async () => {
    const data: any = {
      invoiceNumber: 'INV-001',
      status: 'PAID',
      date: '2023-10-01',
      customerName: 'John Doe',
      organizationName: 'Custom Org Name',
      organizationAddress: '123 Custom St',
      logoUrl: 'https://example.com/logo.png',
      company: { name: 'Custom Org Name', address: '123 Custom St' },
      client: { name: 'John Doe' },
      items: [{ itemCode: 'B-001', itemName: 'Croissant', quantity: 2, rate: 2.5, amount: 5.0 }],
      subtotal: 5.0,
      tax: 0.8,
      total: 5.8
    };

    await renderToBuffer(<Templates.InvoiceTemplate data={data} />);

    const headerCall = vi.mocked(PDFHeader).mock.calls[0][0];
    expect(headerCall).toMatchObject({
      orgName: 'Custom Org Name',
      orgAddress: '123 Custom St',
      logoUrl: 'https://example.com/logo.png',
    });

    const footerCall = vi.mocked(PDFFooter).mock.calls[0][0];
    expect(footerCall).toMatchObject({
      orgName: 'Custom Org Name',
    });
  });

  it('passes branding data in ReceiptTemplateV2', async () => {
    const data: Templates.ReceiptPDFDataV2 = {
      receiptNumber: 'REC-001',
      transactionId: 'TXN-001',
      date: '2023-10-01',
      customerName: 'John Doe',
      organizationName: 'Receipt Org',
      organizationAddress: 'Receipt Addr',
      logoUrl: 'https://example.com/receipt-logo.png',
      items: [{ itemName: 'Item', quantity: 1, rate: 10, amount: 10 }],
      subtotal: 10,
      taxTotal: 0,
      discountTotal: 0,
      finalTotal: 10,
      paymentMethod: 'MPESA'
    };

    await renderToBuffer(<Templates.ReceiptTemplateV2 data={data} />);

    const headerCall = vi.mocked(PDFHeader).mock.calls[0][0];
    expect(headerCall).toMatchObject({
      orgName: 'Receipt Org',
      orgAddress: 'Receipt Addr',
      logoUrl: 'https://example.com/receipt-logo.png',
    });
  });

  it('passes branding data in StockRequestTemplate', async () => {
    const data: Templates.StockRequestPDFData = {
      requestNumber: 'REQ-001',
      status: 'PENDING',
      priority: 'HIGH',
      requestDate: '2023-10-01',
      fromLocation: 'Main',
      toLocation: 'Other',
      requestedBy: 'Me',
      items: [],
      organizationName: 'Stock Org',
      logoUrl: 'https://example.com/stock-logo.png'
    };

    await renderToBuffer(<Templates.StockRequestTemplate data={data} />);

    const headerCall = vi.mocked(PDFHeader).mock.calls[0][0];
    expect(headerCall).toMatchObject({
      orgName: 'Stock Org',
      logoUrl: 'https://example.com/stock-logo.png',
    });
  });

  it('passes branding data in StockTransferTemplate', async () => {
    const data: Templates.StockTransferPDFData = {
      transferNumber: 'TRF-001',
      status: 'SHIPPED',
      requestedDate: '2023-10-01',
      fromLocation: 'Main',
      toLocation: 'Other',
      requestedBy: 'Me',
      items: [],
      organizationName: 'Transfer Org',
      logoUrl: 'https://example.com/transfer-logo.png'
    };

    await renderToBuffer(<Templates.StockTransferTemplate data={data} />);

    const headerCall = vi.mocked(PDFHeader).mock.calls[0][0];
    expect(headerCall).toMatchObject({
      orgName: 'Transfer Org',
      logoUrl: 'https://example.com/transfer-logo.png',
    });
  });
});
