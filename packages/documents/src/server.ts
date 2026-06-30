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
import QRCode from 'qrcode';
import {
  Transaction,
  TransactionItem,
  Customer,
  Address,
  Organization,
  Member,
  User,
  Payment,
  Fulfillment,
  InventoryLocation,
  Invoice,
  InvoiceItem,
  InvoiceTemplate,
  ReceiptConfig,
  InvoiceConfig,
  WaybillConfig
} from '@repo/db';

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

import {
  resolveBranding,
  resolveCurrencySettings,
  formatCurrency,
  formatAddress,
} from "./utils";

export {
  resolveBranding,
  resolveCurrencySettings,
  formatCurrency,
  formatAddress,
};

/**
 * Generates a QR code as a data URL.
 */
export async function generateQRCode(text: string): Promise<string> {
  return QRCode.toDataURL(text);
}

/**
 * Data Mappers to transform Prisma entities to Document data structures.
 * These are intended to be used in the server (apps/api or apps/main server actions/routes).
 */

type TransactionWithDetails = Transaction & {
  location?: (InventoryLocation & { address?: any }) | null;
  organization?: (Organization & {
    settings?: any;
    invoiceConfig?: InvoiceConfig | null;
    receiptConfig?: ReceiptConfig | null;
    waybillConfig?: WaybillConfig | null;
    address?: any;
  }) | null;
  customer?: (Customer & { addresses?: Address[] }) | null;
  member?: (Member & { user?: Pick<User, 'name'> | null }) | null;
  items?: TransactionItem[];
  payments?: Payment[];
  fulfillments?: (Fulfillment & { shippingAddress?: Address | null; driver?: any })[];
};

export const Mappers = {
  /**
   * Maps a Transaction entity to WaybillData.
   */
  toWaybillData(
    transaction: TransactionWithDetails,
    fulfillment?: (Fulfillment & { shippingAddress?: Address | null; driver?: any }) | null,
    qrCodeUrl?: string
  ): WaybillData {
    const senderAddress = formatAddress(transaction.location?.address) || formatAddress(transaction.organization?.address) || 'Main Office';

    const shippingAddressObj = fulfillment?.shippingAddress;
    const customerAddressObj = transaction.customer?.addresses?.[0];

    const recipientAddress = formatAddress(shippingAddressObj) || formatAddress(customerAddressObj) || 'Pickup at Store';
    const recipientName = (shippingAddressObj as any)?.name || transaction.customer?.name || 'Guest Customer';
    const recipientPhone = (shippingAddressObj as any)?.phone || transaction.customer?.phone || undefined;

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
        phone: (transaction.location as any)?.phone || transaction.organization?.phone || undefined,
        email: transaction.organization?.email || undefined,
      },
      recipient: {
        name: recipientName,
        address: recipientAddress,
        phone: recipientPhone || undefined,
        notes: (fulfillment?.deliveryNotes || transaction.notes) || undefined,
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
  toReceiptData(transaction: TransactionWithDetails): ReceiptData {
    if (!transaction) throw new Error('Transaction is required for Receipt mapping');

    const currencySettings = resolveCurrencySettings(transaction, transaction.organization);
    const branding = resolveBranding(transaction.organization, transaction.organization?.receiptConfig);

    return {
      id: transaction.id,
      number: transaction.number,
      receiptNumber: transaction.number,
      orderNumber: transaction.number,
      date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      tags: transaction.tags || [],
      locationName: transaction.location?.name,
      createdBy: (transaction.member?.user as any)?.name || (transaction.member as any)?.name || undefined,
      status: transaction.status,
      customer: {
        name: (transaction.customer as any)?.name || 'Walk-in Customer',
        email: transaction.customer?.email || undefined,
        phone: transaction.customer?.phone || undefined,
        address: formatAddress(transaction.customer?.addresses?.[0]),
      },
      items: (transaction.items || []).map((item: TransactionItem) => ({
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
    transactions: TransactionWithDetails[],
    organization: Organization,
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
        paymentInfo: t.payments?.map((p: Payment) => `${p.method} (${p.status})`).join(', ') || 'N/A',
        items: (t.items || []).map((item: TransactionItem) => ({
          productName: item.productName,
          variantName: item.variantName,
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
  toInvoiceData(
    transaction: TransactionWithDetails | (Invoice & {
      items: InvoiceItem[];
      organization: Organization & { settings: any; invoiceConfig: InvoiceConfig | null };
      template: InvoiceTemplate | null;
      transaction: Transaction | null;
    }),
    options: { currencySymbolMap?: Record<string, string>, logoPath?: string } = {}
  ): InvoiceData {
    if (!transaction) throw new Error('Transaction/Invoice is required for Invoice mapping');

    // Type guard for Invoice vs Transaction
    const isInvoice = 'invoiceNumber' in transaction || ('grandTotal' in transaction && !('finalTotal' in transaction));

    let currencySettings;
    let branding;
    let netTotal: number;
    let totalTaxes: number;
    let grandTotal: number;
    let discountTotal: number;
    let amountPaid: number;
    let balanceDue: number;
    let items: any[];
    let number: string;
    let createdAt: Date;
    let dueDate: Date | null;
    let status: string;
    let customerName: string;
    let customerEmail: string | undefined;
    let customerPhone: string | undefined;
    let customerAddress: string;
    let notes: string | null;

    if (!isInvoice) {
      const tx = transaction as TransactionWithDetails;
      currencySettings = resolveCurrencySettings(tx, tx.organization);
      branding = resolveBranding(tx.organization, tx.organization?.invoiceConfig);
      netTotal = Number(tx.subtotal || 0);
      totalTaxes = Number(tx.taxTotal || 0);
      grandTotal = Number(tx.finalTotal || 0);
      discountTotal = Number(tx.discountTotal || 0);
      amountPaid = tx.payments?.reduce((acc: number, p: Payment) => acc + Number(p.amount || 0), 0) || 0;
      balanceDue = Math.max(0, grandTotal - amountPaid);
      items = (tx.items || []).map((item: TransactionItem) => ({
        id: item.id,
        description: `${item.productName || 'Item'}${item.variantName ? ` - ${item.variantName}` : ''}`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.subtotal),
        sku: item.sku,
        itemCode: item.sku,
        itemName: item.productName,
        rate: Number(item.unitPrice),
        amount: Number(item.subtotal),
        details: '',
      }));
      number = tx.number;
      createdAt = tx.createdAt;
      dueDate = null; // Transactions might not have a direct due date
      status = tx.status;
      customerName = tx.customer?.name || 'Walk-in Customer';
      customerEmail = tx.customer?.email || undefined;
      customerPhone = tx.customer?.phone || undefined;
      customerAddress = formatAddress(tx.customer?.addresses?.[0]);
      notes = tx.notes;
    } else {
      const inv = transaction as (Invoice & {
        items: InvoiceItem[];
        organization: Organization & { settings: any; invoiceConfig: InvoiceConfig | null };
        template: InvoiceTemplate | null;
        transaction: Transaction | null;
      });
      currencySettings = resolveCurrencySettings(inv.transaction || {}, inv.organization);
      branding = resolveBranding(inv.organization, inv.organization.invoiceConfig);
      netTotal = Number(inv.netTotal || 0);
      totalTaxes = Number(inv.totalTaxes || 0);
      grandTotal = Number(inv.grandTotal || 0);
      discountTotal = 0; // Invoices don't have discountTotal field in schema
      amountPaid = Number(inv.amountPaid || 0);
      balanceDue = Number(inv.balanceDue || 0);
      items = (inv.items || []).map((item: InvoiceItem) => ({
        id: item.id,
        description: item.itemName,
        quantity: item.quantity,
        unitPrice: Number(item.rate),
        totalPrice: Number(item.amount),
        sku: item.itemCode,
        itemCode: item.itemCode,
        itemName: item.itemName,
        rate: Number(item.rate),
        amount: Number(item.amount),
        details: '',
      }));
      number = inv.id.substring(0, 8).toUpperCase(); // Default number for standalone invoice
      createdAt = inv.postingDate;
      dueDate = inv.dueDate;
      status = inv.status;
      customerName = inv.customerName || 'Walk-in Customer';
      customerEmail = undefined;
      customerPhone = inv.kraPin || undefined;
      customerAddress = '';
      notes = null;
    }

    const transactionDate = createdAt ? new Date(createdAt) : new Date();
    const validDate = isNaN(transactionDate.getTime()) ? new Date() : transactionDate;
    const formattedDate = validDate.toLocaleDateString();
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : (isInvoice ? formattedDate : formattedDate);

    const organization = (transaction as any).organization;

    const verificationHash = generateVerificationHash({
      invoiceNumber: number,
      grandTotal,
      date: validDate.toISOString(),
      organizationName: organization?.name || 'Organization',
    });

    const config = organization?.invoiceConfig || {};

    let invoiceNumber = number;
    if (config.invoiceNumberPrefix || config.invoiceNumberSuffix || config.invoiceNumberPadding) {
      const seq = parseInt(number.replace(/\D/g, '')) || 0;
      if (seq > 0) {
        const prefix = config.invoiceNumberPrefix || '';
        const suffix = config.invoiceNumberSuffix || '';
        const padding = config.invoiceNumberPadding || 0;
        invoiceNumber = `${prefix}${String(seq).padStart(padding, '0')}${suffix}`;
      }
    }

    const paymentTerms = 'Payment due upon receipt.';

    return {
      id: transaction.id,
      number: invoiceNumber,
      invoiceNumber: invoiceNumber,
      date: formattedDate,
      invoiceDate: formattedDate,
      dueDate: formattedDueDate,
      status: status || 'PAID',
      tags: (transaction as any).tags || [],
      locationName: (transaction as any).location?.name,
      createdBy: (transaction as any).member?.user?.name,

      currencySymbol: currencySettings.symbol,
      currency: currencySettings.code,
      currencySettings,

      branding,

      customerName,
      customerEmail: customerEmail || '',
      customerAddress,
      customerPhone,

      items,

      subtotal: netTotal,
      tax: totalTaxes,
      total: grandTotal,
      discount: discountTotal,
      shipping: Number((transaction as any).shippingTotal || 0),
      amountPaid,
      balanceDue,

      paymentTerms: paymentTerms,
      bankDetails: {
        accountNo: 'N/A',
        sortCode: 'N/A',
      },

      notes: (notes || config.defaultNotes) || undefined,
      termsAndConditions: config.defaultTerms,
      footerText: config.footerText,
      verificationHash,
    };
  },

  /**
   * Maps a Transaction entity to DeliveryNoteData.
   */
  toDeliveryNoteData(transaction: TransactionWithDetails, fulfillment?: (Fulfillment & { shippingAddress?: Address | null }) | null): DeliveryNoteData {
    const shippingAddressObj = fulfillment?.shippingAddress || transaction.customer?.addresses?.find((a: any) => a.isDefault) || transaction.customer?.addresses?.[0] || {};
    const recipientAddress = formatAddress(shippingAddressObj);
    const recipientName = (shippingAddressObj as any)?.name || transaction.customer?.name || 'Guest Customer';
    const recipientPhone = (shippingAddressObj as any)?.phone || transaction.customer?.phone || undefined;

    const branding = resolveBranding(transaction.organization, transaction.organization?.waybillConfig);

    return {
      id: fulfillment?.id || transaction.id,
      number: `DN-${transaction.number}`,
      orderNumber: transaction.number,
      date: fulfillment?.createdAt || transaction.createdAt || new Date(),
      branding,
      customer: {
        name: transaction.customer?.name || 'Walk-in Customer',
        email: transaction.customer?.email || undefined,
        phone: transaction.customer?.phone || undefined,
      },
      shippingAddress: recipientAddress,
      items: (transaction.items || []).map((item: TransactionItem) => ({
        id: item.id,
        description: `${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}`,
        quantity: item.quantity,
        sku: item.sku,
      })),
      notes: (fulfillment?.deliveryNotes || transaction.notes) || undefined,
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
