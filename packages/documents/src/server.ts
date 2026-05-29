import { InvoiceData } from './templates/invoice-templates';
import { WaybillData, ReceiptData, TransactionAnalyticsExportData, StockReportData } from './types';
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
  if (typeof target !== 'object') return String(target);

  const parts = [
    target.street,
    target.line1,
    target.city,
    target.state,
    target.zipCode,
    target.postalCode,
    target.country,
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
      orderNumber: transaction.number,
      date: fulfillment?.createdAt || transaction.createdAt || new Date(),
      qrCodeUrl,
      logoUrl: transaction.organization?.logo,
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
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.lineTotal || item.subtotal),
        sku: item.sku,
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
      organization: {
        name: organization?.name || 'Organization',
        logo: organization?.logo,
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
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
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
      name: report.name,
      date: new Date(report.createdAt).toLocaleString(),
      generatedBy: report.generatedBy?.user?.name || 'System',
      organization: {
        name: report.organization?.name || 'Organization',
        logo: report.organization?.logo,
      },
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
  toInvoiceData(transaction: any, options: { currencySymbolMap?: Record<string, string>, logoPath?: string } = {}): any {
    const defaultCurrency = transaction.organization?.settings?.defaultCurrency || 'USD';
    const currencySymbol = options.currencySymbolMap?.[defaultCurrency] || defaultCurrency;

    return {
      id: transaction.id,
      invoiceNumber: transaction.number,
      date: new Date(transaction.createdAt).toLocaleDateString(),
      dueDate: new Date(transaction.createdAt).toLocaleDateString(),
      currencySymbol: currencySymbol,
      currency: defaultCurrency,
      customerName: transaction.customer?.name || '',
      customerAddress: formatAddress(transaction.customer?.addresses?.[0]),
      company: {
        name: transaction.organization?.name,
        address: transaction.organization?.address,
        phone: transaction.organization?.phone,
        email: transaction.organization?.email,
        logo: transaction.organization?.logo,
      },
      client: {
        name: transaction.customer?.name || '',
        email: transaction.customer?.email || '',
        address: transaction.customer?.addresses?.[0] || {},
      },
      payment: {
        terms: 'Payment due upon receipt.',
        availableMethods: ['CASH', 'CREDIT_CARD', 'MOBILE_PAYMENT', 'BANK_TRANSFER'],
      },
      items: transaction.items.map((item: any) => ({
        qty: item.quantity,
        description: `${item.productName} - ${item.variantName || ''}`,
        price: Number(item.unitPrice),
        amount: Number(item.subtotal || item.lineTotal),
      })),
      subtotal: Number(transaction.subtotal),
      tax: Number(transaction.taxTotal),
      shipping: Number(transaction.shippingTotal || 0),
      total: Number(transaction.finalTotal),
      notes: transaction.notes,
    };
  }
};
