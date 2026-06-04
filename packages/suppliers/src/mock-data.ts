import { Supplier, SupplierUI } from "./types";

export const mockSuppliers: SupplierUI[] = [
  {
    id: '1',
    name: 'Urban Deals',
    code: 'SUP89907',
    type: 'WHOLESALER',
    status: 'active',
    rating: 4.3,
    totalReviews: 4807,
    joinedDate: '2024-03-17',
    lastLogged: 'Sept 11, at 1:12 pm',
    description: 'We are committed to delivering products that exceed your expectations. Our rigorous quality control processes ensure that every item we supply meets industry standards.',
    contact: {
      primaryContact: 'John Doe',
      phone: '+62-789-907',
      email: 'urbandeals@mail.com',
      website: 'urbandeals.com'
    },
    address: {
      street: 'Syracuse, Connecticut',
      city: 'Syracuse',
      state: 'CT',
      zipCode: '35624',
      country: 'United States'
    },
    businessInfo: {
      currency: 'USD',
      paymentTerms: 'Net 30',
      taxId: 'TX123456',
      registrationNumber: 'REG987654'
    },
    categories: ['Electronics', 'Accessories'],
    performance: {
      rating: 4.3,
      qualityScore: 92,
      totalOrders: 156,
      onTimeDelivery: 98,
      leadTimeDays: 5,
      responseTime: 2
    },
    shippingCarriers: ['FedEx', 'DHL', 'UPS'],
    stockStatus: 'In Stock',
    createdAt: new Date().toISOString()
  }
];

export const mockProducts = [
  {
    id: 'p1',
    productId: 'prod1',
    product: { name: 'Smart Watch Series 9', sku: 'SW-009' },
    variant: { name: 'Space Gray' },
    supplierSku: 'UDS-SW-09-SG',
    costPrice: 299.00,
    isPreferred: true
  },
  {
    id: 'p2',
    productId: 'prod2',
    product: { name: 'Wireless Earbuds Pro', sku: 'WE-PRO' },
    variant: { name: 'White' },
    supplierSku: 'UDS-WE-PRO-W',
    costPrice: 149.50,
    isPreferred: false
  }
];

export const mockReviews = [
  {
    id: 'r1',
    author: 'Michell Ronin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michell',
    rating: 5,
    title: 'Well done!',
    comment: 'Great for tracking my daily steps and workouts. The battery life could be better, but overall a solid product!',
    date: 'Today, 12:05 pm'
  },
  {
    id: 'r2',
    author: 'John Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    rating: 4,
    title: 'Great Work!',
    comment: 'Reliable supplier, quality of the items is consistently high.',
    date: 'Yesterday, 09:30 am'
  }
];
