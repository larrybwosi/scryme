import { InvoiceData } from './templates/v1/invoice-templates';
import { WaybillData, ReceiptData, TransactionAnalyticsExportData, StockReportData, DeliveryNoteData } from './types';
import * as crypto from 'crypto';

/**
 * Generates a verification hash for an invoice.
 */
export function generateVerificationHash(data: {
  invoiceNumber: string;
  grandTotal: number;
  date: string;
  organizationName: string;
}, secret: string = process.env.DOCUMENT_SIGNING_SECRET || 'default_secret'): string {
  const content = `${data.invoiceNumber}-${data.grandTotal}-${data.date}-${data.organizationName}`;
  return crypto.createHmac('sha256', secret)
    .update(content)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

/**
 * Format address object or string to a string.
 */
export function formatAddress(input: any): string {
  if (!input) return '';
  if (typeof input === 'string') return input;

  const target = input.address && typeof input.address === 'object' ? input.address : input;
  const data = typeof target === 'object' ? target : input;

  if (!data || typeof data !== 'object') return String(input);

  const parts = [
    data.street,
    data.street1,
    data.street2,
    data.line1,
    data.city,
    data.state,
    data.zipCode,
    data.postalCode,
    data.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Data Mappers to transform Prisma entities to Document data structures.
 * These are intended to be used in the server (apps/api or apps/main server actions/routes).
 */

export const Mappers = {
  /**
   * Maps a Transaction entity to WaybillData.
   */
  toWaybillData(transaction: any, fulfillment?: any, qrCodeUrl?: string): WaybillData {
    const senderAddress = formatAddress(transaction.location?.address) || formatAddress(transaction.organization?.address) || 'Main Office';

    const shippingAddressObj = fulfillment?.shippingAddress;
    const customerAddressObj = transaction.customer?.addresses?.[0];

    const recipientAddress = formatAddress(shippingAddressObj) || formatAddress(customerAddressObj) || 'Pickup at Store';
    const recipientName = shippingAddressObj?.name || transaction.customer?.name || 'Guest Customer';
    const recipientPhone = shippingAddressObj?.phone || transaction.customer?.phone;

    return {
      id: fulfillment?.id || transaction.id,
      number: transaction.number,
      orderNumber: transaction.number,
      date: fulfillment?.createdAt || transaction.createdAt || new Date(),
      qrCodeUrl,
      branding: {
        logoUrl: transaction.organization?.logo,
        companyName: transaction.organization?.name || 'Sender',
        companyAddress: senderAddress,
        companyPhone: transaction.location?.phone || transaction.organization?.phone,
        companyEmail: transaction.organization?.email,
        primaryColor: transaction.organization?.primaryColor,
      },
      sender: {
        name: transaction.organization?.name || 'Sender',
        address: senderAddress,
        phone: transaction.location?.phone || transaction.organization?.phone,
        email: transaction.organization?.email,
      },
      recipient: {
        name: recipientName,
        address: recipientAddress,
        phone: recipientPhone,
        notes: fulfillment?.deliveryNotes || transaction.notes,
      },
      meta: {
        driverName: fulfillment?.driver?.member?.name,
        serviceType: 'Standard Delivery',
      },
    };
  },

  /**
   * Maps a Transaction entity to ReceiptData.
   */
  toReceiptData(transaction: any): ReceiptData {
    return {
      id: transaction.id,
      number: transaction.number,
      receiptNumber: transaction.number,
      orderNumber: transaction.number,
      date: transaction.createdAt,
      customer: {
        name: transaction.customer?.name || 'Walk-in Customer',
        email: transaction.customer?.email,
        phone: transaction.customer?.phone,
        address: formatAddress(transaction.customer?.addresses?.[0]),
      },
      items: transaction.items.map((item: any) => ({
        id: item.id,
        description: `${item.productName} ${item.variantName || ''}`,
        quantity: item.quantity, qty: item.quantity,
        unitPrice: Number(item.unitPrice), price: Number(item.unitPrice),
        totalPrice: Number(item.lineTotal || item.subtotal), total: Number(item.lineTotal || item.subtotal),
        sku: item.sku,
        itemName: item.productName,
        rate: Number(item.unitPrice),
        amount: Number(item.lineTotal || item.subtotal),
      })),
      subtotal: Number(transaction.subtotal),
      tax: Number(transaction.taxTotal),
      total: Number(transaction.finalTotal),
      discountTotal: Number(transaction.discountTotal || 0),
      paymentMethod: transaction.payments?.[0]?.method || 'CASH',
      amountReceived: transaction.payments?.[0]?.amountReceived ? Number(transaction.payments[0].amountReceived) : undefined,
      change: transaction.payments?.[0]?.change ? Number(transaction.payments[0].change) : undefined,
      branding: {
        companyName: transaction.organization?.name,
        companyAddress: formatAddress(transaction.organization?.address),
        logoUrl: transaction.organization?.logo,
        primaryColor: transaction.organization?.primaryColor,
      },
    };
  },

  /**
   * Maps Transaction list to TransactionAnalyticsExportData.
   */
  toAnalyticsExportData(
    transactions: any[],
    organization: any,
    dateRangeText: string,
    activeFiltersText?: string
  ): TransactionAnalyticsExportData {
    return {
      id: organization?.id || 'org',
      number: 'ANALYTICS-' + new Date().getTime(),
      date: new Date(),
      branding: {
        companyName: organization?.name || 'Organization',
        logoUrl: organization?.logo,
        primaryColor: organization?.primaryColor,
      },
      dateRangeText,
      activeFiltersText,
      transactions: transactions.map(t => ({
        number: t.number,
        date: new Date(t.createdAt).toLocaleDateString(),
        customerName: t.customer?.name || 'N/A',
        total: Number(t.finalTotal),
        paymentInfo: t.payments?.map((p: any) => `${p.method} (${p.status})`).join(', ') || 'N/A',
        items: t.items.map((item: any) => ({
          productName: item.productName || item.variant?.product?.name,
          variantName: item.variantName || item.variant?.name,
          quantity: item.quantity, qty: item.quantity,
          unitPrice: Number(item.unitPrice), price: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
      })),
    };
  },

  /**
   * Maps a StockReport entity to StockReportData.
   */
  toStockReportData(report: any): StockReportData {
    const data = typeof report.data === 'string' ? JSON.parse(report.data) : report.data;
    return {
      id: report.id,
      number: 'STOCK-' + report.id,
      date: report.createdAt,
      branding: {
        companyName: report.organization?.name || 'Organization',
        logoUrl: report.organization?.logo,
        primaryColor: report.organization?.primaryColor,
      },
      name: report.name,
      generatedBy: report.generatedBy?.user?.name || 'System',
      items: (data?.items || []).map((item: any) => ({
        productName: item.name || item.productName,
        variantName: item.variantName || '',
        sku: item.sku,
        currentStock: item.quantity || item.currentStock,
        unit: item.unit || 'units',
      })),
    };
  },

  /**
   * Maps a Transaction entity to InvoiceData.
   */
  toInvoiceData(transaction: any, options: { currencySymbolMap?: Record<string, string>, logoPath?: string } = {}): InvoiceData {
    const defaultCurrency = transaction.organization?.settings?.defaultCurrency || 'USD';
    const currencySymbol = options.currencySymbolMap?.[defaultCurrency] || defaultCurrency;

    const netTotal = Number(transaction.subtotal);
    const totalTaxes = Number(transaction.taxTotal);
    const grandTotal = Number(transaction.finalTotal);
    const discountTotal = Number(transaction.discountTotal || 0);
    const amountPaid = transaction.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    const items = transaction.items.map((item: any) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.unitPrice);
      const amount = Number(item.subtotal || item.lineTotal);
      const description = `${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}`;

      return {
        id: item.id,
        description,
        quantity,
        unitPrice: rate,
        totalPrice: amount,
        sku: item.sku || item.id,
        itemCode: item.sku || item.id,
        itemName: item.productName,
        rate,
        amount,
        details: '',
      };
    });

    const transactionDate = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
    const validDate = isNaN(transactionDate.getTime()) ? new Date() : transactionDate;
    const formattedDate = validDate.toLocaleDateString();
    const formattedDueDate = transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : formattedDate;

    const verificationHash = generateVerificationHash({
      invoiceNumber: transaction.number,
      grandTotal,
      date: validDate.toISOString(),
      organizationName: transaction.organization?.name || 'Organization',
    });

    const orgAddressObj = typeof transaction.organization?.address === 'string'
      ? { street: transaction.organization.address }
      : (transaction.organization?.address || {});

    const config = transaction.organization?.invoiceConfig || {};

    const branding = {
      companyName: config.companyName || transaction.organization?.name,
      companyAddress: config.companyAddress || formatAddress(transaction.organization?.address),
      companyPhone: config.companyPhone || transaction.organization?.phone,
      companyEmail: config.companyEmail || transaction.organization?.email,
      logoUrl: config.logoUrl || transaction.organization?.logo,
      companyWebsite: config.companyWebsite || transaction.organization?.website || '',
      companyTagline: transaction.organization?.description || '',
      primaryColor: config.primaryColor || transaction.organization?.primaryColor,
      showPoweredBy: config.showPoweredBy ?? true,
      watermarkText: config.watermarkText,
      customFields: config.customFields,
    };

    let invoiceNumber = transaction.number;
    if (config.invoiceNumberPrefix || config.invoiceNumberSuffix || config.invoiceNumberPadding) {
      // If we have custom numbering config, we use the transaction's sequence number if available,
      // or try to extract it from the number. For now, we'll assume the transaction.number is what we format
      // if it's numeric, otherwise we just use it as is.
      const seq = parseInt(transaction.number.replace(/\D/g, '')) || 0;
      if (seq > 0) {
        const prefix = config.invoiceNumberPrefix || '';
        const suffix = config.invoiceNumberSuffix || '';
        const padding = config.invoiceNumberPadding || 0;
        invoiceNumber = `${prefix}${String(seq).padStart(padding, '0')}${suffix}`;
      }
    }

    const customerAddressObj = transaction.customer?.addresses?.find((a: any) => a.isDefault) || transaction.customer?.addresses?.[0] || {};

    const paymentTerms = 'Payment due upon receipt.';

    return {
      id: transaction.id,
      number: invoiceNumber,
      invoiceNumber: invoiceNumber,
      date: formattedDate,
      invoiceDate: formattedDate,
      dueDate: formattedDueDate,
      status: transaction.status || 'PAID',

      currencySymbol,
      currency: defaultCurrency,

      branding,

      customerName: transaction.customer?.name || 'Walk-in Customer',
      customerEmail: transaction.customer?.email || '',
      customerAddress: formatAddress(customerAddressObj),
      customerPhone: transaction.customer?.phone,

      items,

      subtotal: netTotal,
      tax: totalTaxes,
      total: grandTotal,
      discount: discountTotal,
      shipping: Number(transaction.shippingTotal || 0),
      amountPaid,
      balanceDue,

      paymentTerms: paymentTerms,
      bankDetails: {
        accountNo: 'N/A',
        sortCode: 'N/A',
      },

      notes: transaction.notes || config.defaultNotes,
      termsAndConditions: config.defaultTerms,
      footerText: config.footerText,
      verificationHash,
    };
  },

  /**
   * Maps a Transaction entity to DeliveryNoteData.
   */
  toDeliveryNoteData(transaction: any, fulfillment?: any): DeliveryNoteData {
    const senderAddress = formatAddress(transaction.location?.address) || formatAddress(transaction.organization?.address) || 'Main Office';

    const shippingAddressObj = fulfillment?.shippingAddress || transaction.customer?.addresses?.find((a: any) => a.isDefault) || transaction.customer?.addresses?.[0] || {};
    const recipientAddress = formatAddress(shippingAddressObj);
    const recipientName = shippingAddressObj?.name || transaction.customer?.name || 'Guest Customer';
    const recipientPhone = shippingAddressObj?.phone || transaction.customer?.phone;

    return {
      id: fulfillment?.id || transaction.id,
      number: `DN-${transaction.number}`,
      orderNumber: transaction.number,
      date: fulfillment?.createdAt || transaction.createdAt || new Date(),
      branding: {
        logoUrl: transaction.organization?.logo,
        companyName: transaction.organization?.name || 'Sender',
        companyAddress: senderAddress,
        companyPhone: transaction.location?.phone || transaction.organization?.phone,
        companyEmail: transaction.organization?.email,
        primaryColor: transaction.organization?.primaryColor,
      },
      customer: {
        name: transaction.customer?.name || 'Walk-in Customer',
        email: transaction.customer?.email,
        phone: transaction.customer?.phone,
      },
      shippingAddress: recipientAddress,
      items: transaction.items.map((item: any) => ({
        id: item.id,
        description: `${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}`,
        quantity: item.quantity,
        sku: item.sku,
      })),
      notes: fulfillment?.deliveryNotes || transaction.notes,
    };
  }
};

export { WaybillDocument } from './templates/v1/Waybill';
export { DeliveryNoteDocument } from './templates/v1/DeliveryNote';
export { InvoicePDF as SimpleInvoicePDF } from './templates/v1/InvoicePDF';
export { DocumentGenerator } from './index';
