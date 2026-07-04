import { BrandingOptions, CurrencySettings } from "../../types";

export interface V3Item {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ref?: string | number;
}

export interface V3Contact {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface V3BankDetails {
  name?: string;
  accountNo?: string;
  sortCode?: string;
  iban?: string;
  swift?: string;
}

export interface V3Signature {
  name?: string;
  title?: string;
  image?: string; // Base64 or URL
}

export interface V3DocumentData {
  type: "invoice" | "receipt";
  number: string;
  date: string;
  dueDate?: string;

  company: V3Contact & {
    slogan?: string;
    logo?: string;
  };

  customer: V3Contact;

  items: V3Item[];

  subtotal: number;
  tax: number;
  taxRate?: number;
  discount?: number;
  discountRate?: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;

  currency: {
    symbol: string;
    code: string;
  };

  paymentMethod?: string;
  paymentTerms?: string;
  paymentInfo?: string;
  bankDetails?: V3BankDetails;

  terms?: string;
  footerText?: string;
  footerWebsite?: string;

  signature?: V3Signature;

  // KRA Compliance
  kraPin?: string;
  kraControlCode?: string;
  kraReceiptNumber?: string;

  // Branding
  primaryColor?: string;
  secondaryColor?: string;
}
