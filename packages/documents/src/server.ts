import { InvoiceData } from './templates/v1/invoice-templates';
import {
  WaybillData,
  ReceiptData,
  TransactionAnalyticsExportData,
  StockReportData,
  DeliveryNoteData,
  BrandingOptions,
  CurrencySettings
} from './types';
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
 * Resolves branding options based on a hierarchy of configurations.
 */
export function resolveBranding(organization: any, config: any = {}): BrandingOptions {
  const showLogo = config.showLogo ?? true;
  const logoUrl = showLogo ? (config.logoUrl || organization?.logo) : null;

  return {
    companyName: config.companyName || organization?.name || 'Organization',
    companyAddress: config.companyAddress || formatAddress(organization?.address),
    companyPhone: config.companyPhone || organization?.phone,
    companyEmail: config.companyEmail || organization?.email,
    companyWebsite: config.companyWebsite || organization?.website || '',
    companyTagline: config.companyTagline || organization?.description || '',
    logoUrl,
    showLogo,
    primaryColor: config.primaryColor || organization?.primaryColor || '#2563eb',
    showPoweredBy: config.showPoweredBy ?? true,
    watermarkText: config.watermarkText,
    customFields: config.customFields,
  };
}

/**
 * Resolves currency settings based on transaction and organization defaults.
 */
export function resolveCurrencySettings(transaction: any, organization: any): CurrencySettings {
  const defaultCurrency = organization?.settings?.defaultCurrency || 'USD';
  const defaultLocale = organization?.settings?.defaultTimezone === 'Africa/Nairobi' ? 'en-KE' : 'en-US';

  const code = transaction?.currencyCode || transaction?.currency || defaultCurrency;

  // Mapping some common symbols
  const symbolMap: Record<string, string> = {
    'USD': '$',
    'KES': 'KSh',
    'EUR': '€',
    'GBP': '£',
  };

  return {
    code,
    symbol: symbolMap[code] || code,
    locale: defaultLocale, // In a real app, this might come from org settings
    precision: 2,
  };
}

/**
 * Formats a numeric value as a currency string.
 */
export function formatCurrency(amount: number, settings: CurrencySettings): string {
  try {
    return new Intl.NumberFormat(settings.locale || 'en-US', {
      style: 'currency',
      currency: settings.code,
      minimumFractionDigits: settings.precision ?? 2,
    }).format(amount);
  } catch (e) {
    return `${settings.symbol || settings.code} ${amount.toFixed(settings.precision ?? 2)}`;
  }
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

    const branding = resolveBranding(transaction.organization, transaction.organization?.waybillConfig);

    return {
      id: fulfillment?.id || transaction.id,
      number: transaction.number,
      orderNumber: transaction.number,
      date: fulfillment?.createdAt || transaction.createdAt || new Date(),
      qrCodeUrl,
      branding,
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
    if (!transaction) throw new Error('Transaction is required for Receipt mapping');

    const currencySettings = resolveCurrencySettings(transaction, transaction.organization);
    const branding = resolveBranding(transaction.organization, transaction.organization?.receiptConfig);

    return {
      id: transaction.id,
      number: transaction.number,
      receiptNumber: transaction.number,
      orderNumber: transaction.number,
      date: transaction.createdAt || new Date(),
      tags: transaction.tags || [],
      locationName: transaction.location?.name,
      createdBy: transaction.member?.user?.name,
      status: transaction.status,
      customer: {
        name: transaction.customer?.name || 'Walk-in Customer',
        email: transaction.customer?.email,
        phone: transaction.customer?.phone,
        address: formatAddress(transaction.customer?.addresses?.[0]),
      },
      items: (transaction.items || []).map((item: any) => ({
        id: item.id,
        description: `${item.productName || 'Item'} ${item.variantName || ''}`,
        quantity: Number(item.quantity || 0), qty: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0), price: Number(item.unitPrice || 0),
        totalPrice: Number(item.lineTotal || item.subtotal || 0), total: Number(item.lineTotal || item.subtotal || 0),
        sku: item.sku,
        itemName: item.productName || 'Item',
        rate: Number(item.unitPrice || 0),
        amount: Number(item.lineTotal || item.subtotal || 0),
      })),
      subtotal: Number(transaction.subtotal || 0),
      tax: Number(transaction.taxTotal || 0),
      total: Number(transaction.finalTotal || 0),
      discountTotal: Number(transaction.discountTotal || 0),
      paymentMethod: transaction.payments?.[0]?.method || 'CASH',
      amountReceived: transaction.payments?.[0]?.amountReceived ? Number(transaction.payments[0].amountReceived) : undefined,
      change: transaction.payments?.[0]?.change ? Number(transaction.payments[0].change) : undefined,
      currency: currencySettings.code,
      currencySymbol: currencySettings.symbol,
      currencySettings,
      branding,
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
      branding: resolveBranding(organization),
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
      branding: resolveBranding(report.organization),
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
    if (!transaction) throw new Error('Transaction is required for Invoice mapping');

    const currencySettings = resolveCurrencySettings(transaction, transaction.organization);
    const branding = resolveBranding(transaction.organization, transaction.organization?.invoiceConfig);

    const netTotal = Number(transaction.subtotal || 0);
    const totalTaxes = Number(transaction.taxTotal || 0);
    const grandTotal = Number(transaction.finalTotal || 0);
    const discountTotal = Number(transaction.discountTotal || 0);
    const amountPaid = transaction.payments?.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    const items = (transaction.items || []).map((item: any) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.unitPrice || 0);
      const amount = Number(item.subtotal || item.lineTotal || 0);
      const description = `${item.productName || 'Item'}${item.variantName ? ` - ${item.variantName}` : ''}`;

      return {
        id: item.id,
        description,
        quantity,
        unitPrice: rate,
        totalPrice: amount,
        sku: item.sku || item.id,
        itemCode: item.sku || item.id,
        itemName: item.productName || 'Item',
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

    const config = transaction.organization?.invoiceConfig || {};

    let invoiceNumber = transaction.number;
    if (config.invoiceNumberPrefix || config.invoiceNumberSuffix || config.invoiceNumberPadding) {
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
      tags: transaction.tags || [],
      locationName: transaction.location?.name,
      createdBy: transaction.member?.user?.name,

      currencySymbol: currencySettings.symbol,
      currency: currencySettings.code,
      currencySettings,

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
    const shippingAddressObj = fulfillment?.shippingAddress || transaction.customer?.addresses?.find((a: any) => a.isDefault) || transaction.customer?.addresses?.[0] || {};
    const recipientAddress = formatAddress(shippingAddressObj);
    const recipientName = shippingAddressObj?.name || transaction.customer?.name || 'Guest Customer';
    const recipientPhone = shippingAddressObj?.phone || transaction.customer?.phone;

    const branding = resolveBranding(transaction.organization, transaction.organization?.waybillConfig);

    return {
      id: fulfillment?.id || transaction.id,
      number: `DN-${transaction.number}`,
      orderNumber: transaction.number,
      date: fulfillment?.createdAt || transaction.createdAt || new Date(),
      branding,
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
export {
  getInvoiceTemplate,
  renderInvoiceTemplate,
} from './templates/v1/invoice-templates';
export { ReceiptTemplate as ReceiptTemplateV2 } from './templates/v2/ReceiptTemplate';
export { DocumentGenerator } from './index';
