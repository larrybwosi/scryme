import { Mappers } from './server';

export function getMockInvoiceTransaction(orgDetails?: any) {
  return {
    id: 'mock-123',
    number: 'INV-2024-001',
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'PAID',
    subtotal: 1250.00,
    taxTotal: 200.00,
    shippingTotal: 50.00,
    finalTotal: 1500.00,
    notes: 'Thank you for your business! Please reach out if you have any questions regarding this invoice.',
    organization: {
      name: orgDetails?.name || 'Scryme Solutions Ltd',
      address: orgDetails?.address || '123 Business Avenue, Suite 100, Nairobi, Kenya',
      phone: orgDetails?.phone || '+254 712 345 678',
      email: orgDetails?.email || 'billing@scryme.com',
      logo: orgDetails?.logo || 'https://via.placeholder.com/150x50?text=LOGO',
      settings: {
        defaultCurrency: orgDetails?.settings?.defaultCurrency || 'USD',
      }
    },
    customer: {
      name: 'Acme Corporation',
      email: 'finance@acme.com',
      phone: '+254 799 888 777',
      addresses: [
        {
          street: '456 Industrial Road',
          city: 'Nairobi',
          state: 'Nairobi',
          zipCode: '00100',
          country: 'Kenya'
        }
      ]
    },
    items: [
      {
        id: 'item-1',
        productName: 'Professional Web Design',
        variantName: 'Corporate Package',
        sku: 'SRV-WEB-001',
        quantity: 1,
        unitPrice: 800.00,
        subtotal: 800.00
      },
      {
        id: 'item-2',
        productName: 'Cloud Hosting',
        variantName: 'Annual Subscription',
        sku: 'SRV-HST-002',
        quantity: 1,
        unitPrice: 300.00,
        subtotal: 300.00
      },
      {
        id: 'item-3',
        productName: 'Domain Registration',
        variantName: '.com - 2 Years',
        sku: 'SRV-DOM-003',
        quantity: 1,
        unitPrice: 150.00,
        subtotal: 150.00
      }
    ],
    payments: [
      {
        id: 'pay-1',
        amount: 1500.00,
        method: 'BANK_TRANSFER',
        status: 'COMPLETED',
        createdAt: new Date()
      }
    ]
  };
}

export function getMockInvoiceData(orgDetails?: any) {
  const transaction = getMockInvoiceTransaction(orgDetails);
  return Mappers.toInvoiceData(transaction);
}

export function getMockReceiptData(orgDetails?: any) {
  const invoiceData = getMockInvoiceData(orgDetails);
  return {
    ...invoiceData,
    receiptNumber: "REC-2024-001",
    amountReceived: invoiceData.total,
    change: 0,
    paymentMethod: "BANK_TRANSFER",
  };
}

export function getMockWaybillData(orgDetails?: any) {
  const invoiceData = getMockInvoiceData(orgDetails);
  return {
    ...invoiceData,
    orderNumber: "ORD-2024-001",
    sender: {
      name: orgDetails?.name || "Scryme Solutions Ltd",
      address: orgDetails?.address || "123 Business Avenue, Suite 100, Nairobi, Kenya",
      phone: orgDetails?.phone || "+254 712 345 678",
      email: orgDetails?.email || "logistics@scryme.com",
    },
    recipient: {
      name: "Acme Corporation",
      address: "456 Industrial Road, Nairobi, Kenya",
      phone: "+254 799 888 777",
      email: "finance@acme.com",
    },
  };
}
