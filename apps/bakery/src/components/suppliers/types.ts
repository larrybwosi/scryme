export interface Supplier {
  id: string;
  name: string;
  code: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'service_provider';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
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
  };
  performance: {
    rating: number;
    onTimeDelivery: number;
    qualityScore: number;
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    responseTime: number;
  };
  deliveryLocations: string[];
  categories: string[];
  customBadges?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  lastOrderDate?: string;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
  }>;
  recentOrders: Array<{
    id: string;
    date: string;
    value: number;
    status: string;
  }>;
  createdAt: string;
}
