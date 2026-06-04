export type SupplierType = 'manufacturer' | 'distributor' | 'wholesaler' | 'service_provider';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Supplier {
  id: string;
  name: string;
  code: string;
  type: SupplierType;
  logo?: string | null;
  website?: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  riskLevel: RiskLevel;
  isActive: boolean;
  isFavorite: boolean;
  avgRating: string;
  reviewCount: number;
  products?: ProductSupplier[];
  purchases?: Purchase[];
  reviews: SupplierReview[];
  ratingCounts?: RatingCount[];
  registrationNumber?: string | null;
  taxId?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  leadTime?: number | null;
  primaryContact?: string | null;
  street?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface ProductSupplier {
  id: string;
  productId: string;
  product: {
    name: string;
    sku: string;
    category: {
      name: string;
    };
  };
  variant?: {
    id: string;
    name: string;
    sku: string;
  } | null;
  supplierSku?: string | null;
  costPrice: number | any; // Decimal type from Prisma
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  orderDate: Date | string;
  expectedDate?: Date | string | null;
  totalAmount: number | any;
  status: string;
}

export interface SupplierReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: Date | string;
  member: {
    user: {
      name: string;
      image?: string | null;
    };
  };
}

export interface RatingCount {
  stars: number;
  count: number;
  percentage: number;
}
