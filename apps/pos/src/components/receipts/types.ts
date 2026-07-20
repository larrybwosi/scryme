// types.ts

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  addition?: string;
  notes?: string;
}

export interface PaymentData {
  orderId: string;
  paymentMethod: 'cash' | 'card' | 'mobile';
  amountPaid: number;
  change: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  transactionId?: string;
}

export interface OrganizationData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  tagline?: string;
  // Enterprise Additions
  logoBase64?: string; // For rendering images in PDF
  taxId?: string;
  vatNumber?: string;
}

export interface ReceiptConfig {
  // Layout & Sizing
  width: number;
  padding: number;
  spacing: number;
  itemSpacing: number;
  backgroundColor: string;

  // Typography
  titleSize: number;
  headerSize: number;
  bodySize: number;
  primaryColor: string;
  secondaryColor: string;

  // Localization (New)
  currency: string; // e.g., 'USD', 'EUR', 'KES'
  locale: string; // e.g., 'en-US', 'en-KE'

  // KRA Details
  showKraDetails?: boolean;
  kraPin?: string;
  kraEtr?: string;

  // Header Configuration
  showHeader: boolean;
  logoPosition: 'left' | 'center' | 'right';
  receiptTitle: string;
  showReceiptNumber: boolean;
  showDateTime: boolean;
  showOrderType: boolean;

  // Sections Visibility
  showCustomerInfo: boolean;
  showItemsSection: boolean;
  showTotalsSection: boolean;
  showPaymentSection: boolean;
  showOrderNotes: boolean;
  showSpecialInstructions: boolean;
  showPromoCode: boolean;
  showFooter: boolean;
  showPerforation: boolean;

  // Divider Settings
  showDivider: boolean;
  dividerWidth: number;

  // Tax & Discount Settings
  showTax: boolean;
  showDiscount: boolean;
  taxLabel: string; // e.g., "VAT (16%)"

  // Payment Details
  showPaymentMethod: boolean;
  showAmountReceived: boolean;
  showChange: boolean;

  // Content Labels
  notesTitle: string;
  instructionsTitle: string;
  promoCodeText: string;
  thankYouMessage: string;
  footerText: string;

  // Enterprise Extras
  returnPolicy?: string;
  barcodeEnabled?: boolean;
}
