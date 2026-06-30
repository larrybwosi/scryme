import { db } from '@repo/db';
import { Prisma } from '@repo/db';
import { z } from 'zod';
import { formatVariantDisplayName } from './utils';
import { supplierSchema } from '../lib/validations/suppliers';
import { navariService } from '../services/navari.service';
import { SupplierUI } from '../types/index';

export async function getSuppliers(organizationId: string) {
  const suppliers = await db.supplier.findMany({
    where: {
      organizationId,
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      purchases: {
        take: 5,
        orderBy: {
          orderDate: 'desc',
        },
      },
      documents: true,
      qualityIncidents: {
        include: {
          batch: true,
          stockBatch: { include: { variant: { include: { product: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      },
      priceHistory: {
        include: { variant: { include: { product: true } } },
        orderBy: { effectiveDate: 'desc' },
        take: 10
      }
    },
  });

  const formattedSuppliers: SupplierUI[] = suppliers.map((supplier: any) => {
    const customFields = supplier.customFields ? JSON.parse(supplier.customFields as string) : {};

    const totalOrders = supplier.purchases.length;
    const totalValue = supplier.purchases.reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    return {
      id: supplier.id,
      name: supplier.name,
      code: supplier.code || supplier.name.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      type: (supplier.type.toLowerCase() as any) || 'manufacturer',
      status: (supplier.isActive ? 'active' : 'inactive') as any,
      contact: {
        primaryContact: supplier.primaryContact || 'Unknown Contact',
        phone: supplier.phone || '',
        email: supplier.email || '',
        website: supplier.website || undefined,
      },
      address: {
        street: supplier.street || '',
        city: supplier.city || '',
        state: supplier.state || '',
        zipCode: supplier.zipCode || '',
        country: supplier.country || '',
      },
      businessInfo: {
        taxId: supplier.taxId || '',
        registrationNumber: supplier.registrationNumber || '',
        paymentTerms: supplier.paymentTerms || 'Net 30',
        currency: supplier.currency || 'USD',
      },
      performance: {
        rating: typeof customFields.rating === 'number' ? customFields.rating : 0,
        onTimeDelivery: typeof customFields.onTimeDelivery === 'number' ? customFields.onTimeDelivery : 0,
        qualityScore: typeof customFields.qualityScore === 'number' ? customFields.qualityScore : 0,
        totalOrders,
        totalValue,
        averageOrderValue,
        responseTime: typeof customFields.responseTime === 'number' ? customFields.responseTime : 0,
      },
      deliveryLocations: Array.isArray(customFields.deliveryLocations) ? customFields.deliveryLocations : [],
      categories: supplier.products.map((ps: any) => ps.product.category.name),
      customBadges: Array.isArray(customFields.customBadges) ? customFields.customBadges : [],
      riskLevel: (supplier.riskLevel.toLowerCase() as any) || 'low',
      lastOrderDate: supplier.purchases[0]?.orderDate.toISOString() || undefined,
      products: supplier.products.map((ps: any) => ({
        id: ps.productId,
        name: ps.product.name,
        sku: ps.product.sku,
        category: ps.product.category.name,
      })),
      recentOrders: supplier.purchases.map((p: any) => ({
        id: p.id,
        date: p.orderDate.toISOString(),
        value: Number(p.totalAmount),
        status: p.status,
      })),
      createdAt: supplier.createdAt.toISOString(),
    };
  });

  return formattedSuppliers;
}

export async function getSupplier(organizationId: string, supplierId: string) {
  const supplier = await db.supplier.findFirst({
    where: {
      id: supplierId,
      organizationId,
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      purchases: {
        take: 5,
        orderBy: {
          orderDate: 'desc',
        },
      },
      documents: true,
      qualityIncidents: {
        include: {
          batch: true,
          stockBatch: { include: { variant: { include: { product: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      },
      priceHistory: {
        include: { variant: { include: { product: true } } },
        orderBy: { effectiveDate: 'desc' },
        take: 10
      }
    },
  });

  if (!supplier) return null;

  const customFields = supplier.customFields ? JSON.parse(supplier.customFields as string) : {};
  const totalOrders = supplier.purchases.length;
  const totalValue = supplier.purchases.reduce((sum: number, purchase: any) => sum + Number(purchase.totalAmount), 0);
  const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

  const formattedSupplier: SupplierUI = {
    id: supplier.id,
    name: supplier.name,
    code: supplier.code || supplier.name.toLowerCase().replace(/\s+/g, '-') || 'unknown',
    type: (supplier.type.toLowerCase() as any) || 'manufacturer',
    status: (supplier.isActive ? 'active' : 'inactive') as any,
    contact: {
      primaryContact: supplier.primaryContact || 'Unknown Contact',
      phone: supplier.phone || '',
      email: supplier.email || '',
      website: supplier.website || undefined,
    },
    address: {
      street: supplier.street || '',
      city: supplier.city || '',
      state: supplier.state || '',
      zipCode: supplier.zipCode || '',
      country: supplier.country || '',
    },
    businessInfo: {
      taxId: supplier.taxId || '',
      registrationNumber: supplier.registrationNumber || '',
      paymentTerms: supplier.paymentTerms || 'Net 30',
      currency: supplier.currency || 'USD',
    },
    performance: {
      rating: typeof customFields.rating === 'number' ? customFields.rating : 0,
      onTimeDelivery: typeof customFields.onTimeDelivery === 'number' ? customFields.onTimeDelivery : 0,
      qualityScore: typeof customFields.qualityScore === 'number' ? customFields.qualityScore : 0,
      totalOrders,
      totalValue,
      averageOrderValue,
      responseTime: typeof customFields.responseTime === 'number' ? customFields.responseTime : 0,
    },
    deliveryLocations: Array.isArray(customFields.deliveryLocations) ? customFields.deliveryLocations : [],
    categories: supplier.products.map((ps: any) => ps.product.category.name),
    customBadges: Array.isArray(customFields.customBadges) ? customFields.customBadges : [],
    riskLevel: (supplier.riskLevel.toLowerCase() as any) || 'low',
    lastOrderDate: supplier.purchases[0]?.orderDate.toISOString() || undefined,
    products: supplier.products.map((ps: any) => ({
      id: ps.productId,
      name: ps.product.name,
      sku: ps.product.sku,
      category: ps.product.category.name,
    })),
    recentOrders: supplier.purchases.map((p: any) => ({
      id: p.id,
      date: p.orderDate.toISOString(),
      value: Number(p.totalAmount),
      status: p.status,
    })),
    createdAt: supplier.createdAt.toISOString(),
  };

  return formattedSupplier;
}

export async function createSupplier(organizationId: string, body: unknown) {
  const validation = supplierSchema.safeParse(body);

  if (!validation.success) {
    return { error: { errors: validation.error }, status: 400 };
  }

  const data = validation.data;

  // KRA PIN Validation via Navari for Kenyan Organizations
  if (data.address.country === 'KE' || data.address.country === 'Kenya') {
    try {
      if (data.businessInfo.taxId) {
        const pinValidation = await navariService.validateKRAPin(organizationId, data.businessInfo.taxId);
        if (pinValidation && !pinValidation.valid) {
          return {
            error: { message: pinValidation.message || 'Invalid KRA PIN according to KRA records.' },
            status: 400
          };
        }
      }
    } catch (error) {
      console.warn('Navari PIN validation failed, proceeding anyway:', error);
    }
  }

  const supplier = await db.supplier.create({
    data: {
      organizationId,
      name: data.name,
      code: data.code,
      type: data.type.toUpperCase() as any,
      primaryContact: data.contact.primaryContact,
      phone: data.contact.phone,
      email: data.contact.email,
      website: data.contact.website,
      taxId: data.businessInfo.taxId,
      registrationNumber: data.businessInfo.registrationNumber,
      currency: data.businessInfo.currency,
      paymentTerms: data.businessInfo.paymentTerms,
      paymentTermsDays: data.businessInfo.paymentTermsDays,
      street: data.address.street,
      city: data.address.city,
      state: data.address.state,
      zipCode: data.address.zipCode,
      country: data.address.country,
      categories: data.categories as string[],
      riskLevel: (data.riskLevel?.toUpperCase() as any) || 'LOW',
    },
  });

  return supplier;
}
