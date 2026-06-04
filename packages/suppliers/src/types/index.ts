import type { Prisma } from '@repo/db';

export type SupplierRecord = Prisma.SupplierGetPayload<{
  include: {
    documents: true;
    _count: { select: { products: true } };
  };
}>;

export type SupplierWithDetails = Prisma.SupplierGetPayload<{
  include: {
    documents: true;
    products: {
      include: {
        product: true;
        variant: true;
      };
    };
    priceHistory: {
      include: { variant: true };
    };
    performances: true;
    qualityIncidents: true;
  };
}>;

export interface SupplierDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  expiryDate?: Date | null;
  status: string;
  createdAt: Date;
}

export interface SupplierUI {
  id: string;
  name: string;
  code: string;
  type: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'on_hold';
  rating?: number;
  totalReviews?: number;
  joinedDate?: string;
  lastLogged?: string;
  description?: string;
  shippingCarriers?: string[];
  stockStatus?: string;
  contact: {
    primaryContact: string;
    phone: string;
    email: string;
    website?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessInfo: {
    taxId: string;
    registrationNumber: string;
    paymentTerms: string;
    currency: string;
    paymentTermsDays?: number;
  };
  performance: {
    rating: number;
    onTimeDelivery: number;
    qualityScore: number;
    totalOrders: number;
    totalValue?: number;
    averageOrderValue?: number;
    responseTime?: number;
    leadTimeDays?: number;
  };
  deliveryLocations?: string[];
  categories: string[];
  customBadges?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  lastOrderDate?: string;
  products?: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
  }>;
  recentOrders?: Array<{
    id: string;
    date: string;
    value: number;
    status: string;
  }>;
  createdAt: string;
}

// Alias for convenience to reduce code changes
export type Supplier = SupplierUI;

export interface ProductSupplier {
  id: string;
  productId: string;
  variantId?: string;
  supplierId: string;
  supplierSku?: string;
  costPrice: number;
  isPreferred: boolean;
  leadTimeDays?: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    category: {
      name: string;
      color: string;
    };
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface DeliveryItem {
  id: string;
  name: string;
  sku: string;
  quantityReceived: number;
  quantityOrdered?: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
}

export interface Delivery {
  id: string;
  purchaseNumber: string;
  status: string;
  deliveryDate: string | null;
  expectedDate: string | null;
  orderDate?: string;
  supplierName: string;
  totalAmount: number;
  items: DeliveryItem[];
  type: 'PO' | 'RECEIPT';
  approvalStatus?: string;
}

export interface SupplierAnalytics {
  spendTrend: Array<{ date: string; amount: number }>;
  leadTimeTrend: Array<{ date: string; days: number }>;
  orderConsistency: Array<{ date: string; count: number }>;
  categorySpend: Array<{ category: string; amount: number }>;
}

export interface PriceHistoryEntry {
  id: string;
  variantId: string;
  variantName: string;
  costPrice: number;
  effectiveDate: string;
}
