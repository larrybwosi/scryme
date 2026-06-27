import { lazy } from 'react';

// Lazy load the heavy PDF rendering libraries and components
export const PDFReceipt = lazy(() => import('@/components/receipts/pdf-receipt').then(m => ({ default: m.PDFReceipt })));
export const PDFKitchenTicket = lazy(() => import('@/components/receipts/pdf-kitchen-ticket').then(m => ({ default: m.PDFKitchenTicket })));
export const ReceiptPdfDocument = lazy(() => import('@/components/receipt-pdf').then(m => ({ default: m.ReceiptPdfDocument })));
