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

    const netTotal = Number(transaction.subtotal);
    const totalTaxes = Number(transaction.taxTotal);
    const grandTotal = Number(transaction.finalTotal);
    const amountPaid = transaction.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    const items = transaction.items.map((item: any) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.unitPrice);
      const amount = Number(item.subtotal || item.lineTotal);
      const description = `${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}`;

      return {
        // V1 fields
        qty: quantity,
        description,
        price: rate,
        amount,
        // Alias for some templates
        quantity,
        total: amount,
        unitPrice: rate,
        // V2 fields
        itemCode: item.sku || item.id,
        itemName: item.productName,
        rate,
      };
    });

    const verificationHash = generateVerificationHash({
      invoiceNumber: transaction.number,
      grandTotal,
      date: new Date(transaction.createdAt).toISOString(),
      organizationName: transaction.organization?.name || 'Organization',
    });

    const companyData = {
      name: transaction.organization?.name,
      address: formatAddress(transaction.organization?.address),
      phone: transaction.organization?.phone,
      email: transaction.organization?.email,
      logo: transaction.organization?.logo,
    };

    const clientData = {
      name: transaction.customer?.name || 'Walk-in Customer',
      email: transaction.customer?.email || '',
      address: transaction.customer?.addresses?.[0] || {},
      phone: transaction.customer?.phone,
    };

    return {
      id: transaction.id,
      invoiceNumber: transaction.number,
      date: new Date(transaction.createdAt).toLocaleDateString(),
      dueDate: transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : new Date(transaction.createdAt).toLocaleDateString(),
      status: transaction.status || 'PAID',
      currencySymbol,
      currency: defaultCurrency,

      // V1 expectations
      customerName: clientData.name,
      customerAddress: formatAddress(clientData.address),
      company: companyData,
      organization: companyData,
      client: clientData,
      billingAddress: clientData.address,
      shippingAddress: clientData.address,

      // V2 expectations
      organizationName: companyData.name,
      organizationAddress: companyData.address,
      logoUrl: companyData.logo,
      customerEmail: clientData.email,

      items,

      // Totals
      subtotal: netTotal,
      tax: totalTaxes,
      shipping: Number(transaction.shippingTotal || 0),
      total: grandTotal,

      // V2 totals
      netTotal,
      totalTaxes,
      grandTotal,
      amountPaid,
      balanceDue,

      payment: {
        terms: 'Payment due upon receipt.',
        availableMethods: ['CASH', 'CREDIT_CARD', 'MOBILE_PAYMENT', 'BANK_TRANSFER'],
      },
      notes: transaction.notes,
      verificationHash,
    };
  }
};
