'use client';

import { type ReceiptConfig, type Order } from '@/store/store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ThermalReceiptPreviewProps {
  order: Order;
  config: ReceiptConfig;
  businessName: string;
  businessSlogan?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  branchName?: string;
}

export function ThermalReceiptPreview({
  order,
  config,
  businessName,
  address,
  phone,
  email,
  website,
  branchName,
}: ThermalReceiptPreviewProps) {
  const is58mm = config.paperSize === '58mm';
  const widthClass = is58mm ? 'w-[200px]' : 'w-[300px]';
  const template = config.template || 'standard';

  // Approximate thermal printer font sizes
  const baseSize = config.bodyFontSize || 12;
  const headerSize = config.headerFontSize || 14;
  const titleSize = config.titleFontSize || 20;

  const alignmentClass = config.textAlignment === 'center' ? 'text-center' : 'text-left';
  const dividerStyle = config.dividerStyle === 'dashed' ? 'border-dashed' : config.dividerStyle === 'dotted' ? 'border-dotted' : 'border-solid';
  const primaryColor = config.primaryColor || '#000000';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(config.locale || 'en-US', {
      style: 'currency',
      currency: config.currency || 'KSH',
    }).format(amount);
  };

  const Divider = () => (
    <div
      className={cn('w-full border-t my-2', dividerStyle)}
      style={{ borderColor: config.showBorder ? config.borderColor : primaryColor }}
    />
  );

  return (
    <div
      className={cn(
        'bg-white text-black font-mono shadow-lg mx-auto overflow-hidden transition-all duration-300',
        widthClass,
        config.showBorder && 'border-2'
      )}
      style={{
        padding: `${config.padding || 8}px`,
        borderColor: config.borderColor || '#000',
        color: config.primaryColor || '#000',
      }}
    >
      {/* Header Section */}
      <div className={cn('mb-4', alignmentClass)}>
        {config.showLogo && (
          <div
            className={cn(
              'mb-2 flex',
              config.logoPosition === 'center' ? 'justify-center' : config.logoPosition === 'right' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className="bg-zinc-200 border border-zinc-300 flex items-center justify-center text-[10px] text-zinc-500 uppercase font-bold"
              style={{
                width: `${config.logoWidth || 50}%`,
                aspectRatio: '1/1',
              }}
            >
              Logo
            </div>
          </div>
        )}

        <h1
          className={cn('font-bold leading-tight', template === 'modern' ? 'tracking-tight' : 'uppercase')}
          style={{ fontSize: `${titleSize}px` }}
        >
          {businessName || 'DEALIO POS'}
        </h1>

        {config.showTagline && config.tagline && (
          <p className="italic opacity-80 mt-1" style={{ fontSize: `${headerSize}px` }}>
            {config.tagline}
          </p>
        )}

        <div className="mt-2 space-y-0.5 opacity-90" style={{ fontSize: `${headerSize - 2}px` }}>
          {config.showAddress && address && <p>{address}</p>}
          {(config.showPhone || phone) && <p>Tel: {config.phone || phone}</p>}
          {config.showEmail && email && <p>{email}</p>}
          {config.showWebsite && website && <p>{website}</p>}
        </div>

        {/* Compliance details in header */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-0.5 opacity-70" style={{ fontSize: `${headerSize - 3}px` }}>
          {config.showTaxNumber && config.taxNumber && <span>TIN: {config.taxNumber}</span>}
          {config.showVatNumber && config.vatNumber && <span>VAT: {config.vatNumber}</span>}
          {config.showCompanyRegNumber && config.companyRegNumber && <span>REG: {config.companyRegNumber}</span>}
        </div>
      </div>

      <Divider />

      {/* Meta Data */}
      <div className="space-y-1 mb-3" style={{ fontSize: `${headerSize - 2}px` }}>
        {config.showOrderNumber && (
          <div className="flex justify-between">
            <span>RECEIPT NO:</span>
            <span className="font-bold">
              {config.orderNumberPrefix}
              {order.orderNumber}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{format(new Date(order.createdAt), 'dd/MM/yy HH:mm')}</span>
        </div>
        {branchName && (
          <div className="flex justify-between">
            <span>BRANCH:</span>
            <span>{branchName}</span>
          </div>
        )}
        {config.showOrderType && (
          <div className="flex justify-between">
            <span>TYPE:</span>
            <span className="uppercase">{order.orderType}</span>
          </div>
        )}
        {config.showCashier && order.cashierName && (
          <div className="flex justify-between">
            <span>CASHIER:</span>
            <span>{order.cashierName}</span>
          </div>
        )}
        {config.showCustomerName && order.customerName && (
          <div className="flex justify-between">
            <span>CUSTOMER:</span>
            <span>{order.customerName}</span>
          </div>
        )}
      </div>

      {/* Modern Template Style Header */}
      {template === 'modern' ? (
        <div className="bg-black text-white px-2 py-1 mb-2 flex justify-between font-bold" style={{ fontSize: `${headerSize - 2}px` }}>
          <span>ITEM</span>
          <div className="flex gap-4">
            <span>QTY</span>
            <span>TOTAL</span>
          </div>
        </div>
      ) : (
        <Divider />
      )}

      {/* Items Table */}
      <div className="space-y-2 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex flex-col" style={{ marginBottom: `${config.itemSpacing || 4}px` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <p className="font-bold leading-tight" style={{ fontSize: `${baseSize}px` }}>
                  {item.productName.toUpperCase()}
                </p>
                {item.variantName && item.variantName !== 'Default Variant' && (
                  <p className="text-[10px] opacity-70 italic">({item.variantName})</p>
                )}
                {config.showItemSku && item.sku && (
                  <p className="text-[9px] opacity-60">SKU: {item.sku}</p>
                )}
              </div>
              <div className="flex gap-4 items-start" style={{ fontSize: `${baseSize}px` }}>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right font-bold">
                  {((item.selectedUnit?.price || 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
            {config.showItemNotes && item.notes && (
              <p className="text-[10px] italic opacity-80 pl-2 mt-0.5 border-l border-zinc-300">
                * {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      <Divider />

      {/* Totals Section */}
      <div className="space-y-1 mb-4" style={{ fontSize: `${baseSize}px` }}>
        {config.showSubtotal && (
          <div className="flex justify-between">
            <span>SUBTOTAL</span>
            <span>{formatCurrency(order.subTotal)}</span>
          </div>
        )}
        {config.showTaxBreakdown && (
          <div className="flex justify-between">
            <span>TAX</span>
            <span>{formatCurrency(order.taxes)}</span>
          </div>
        )}
        {config.showDiscountBreakdown && order.discount > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}

        <div
          className={cn(
            'flex justify-between font-black mt-2 pt-2',
            template === 'modern' ? 'bg-zinc-100 p-1' : 'border-t-2 border-black'
          )}
          style={{ fontSize: `${baseSize + 4}px` }}
        >
          <span>TOTAL</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        {config.showSavingsTotal && order.discount > 0 && (
          <div className="flex justify-between text-green-700 font-bold mt-1" style={{ fontSize: `${baseSize - 1}px` }}>
            <span>YOU SAVED</span>
            <span>{formatCurrency(order.discount)}</span>
          </div>
        )}

        {config.showPaymentMethod && (
          <div className="flex justify-between mt-2 pt-2 border-t border-zinc-200 opacity-80" style={{ fontSize: `${baseSize - 1}px` }}>
            <span>PAYMENT METHOD</span>
            <span className="uppercase">{order.paymentMethod}</span>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className={cn('space-y-3', alignmentClass)}>
        <Divider />

        {config.headerText && (
          <p className="whitespace-pre-line" style={{ fontSize: `${baseSize - 1}px` }}>
            {config.headerText}
          </p>
        )}

        {config.showThankYouMessage && (
          <p className="font-bold uppercase tracking-widest" style={{ fontSize: `${baseSize}px` }}>
            {config.thankYouMessage || 'THANK YOU'}
          </p>
        )}

        {config.showNextVisitPromo && config.nextVisitPromoText && (
          <div className="bg-zinc-100 p-2 rounded-sm border border-zinc-200">
            <p className="font-bold" style={{ fontSize: `${baseSize - 1}px` }}>
              {config.nextVisitPromoText}
            </p>
          </div>
        )}

        {(config.showLoyaltyPoints || config.showLoyaltyBalance) && (
          <div className="flex flex-col items-center gap-1 opacity-80" style={{ fontSize: `${baseSize - 2}px` }}>
            {config.showLoyaltyPoints && <p>POINTS EARNED: +{Math.floor(order.total / 10)}</p>}
            {config.showLoyaltyBalance && <p>NEW BALANCE: 1,240 PTS</p>}
          </div>
        )}

        {config.showSocialMedia && config.socialMediaHandle && (
          <p className="font-bold" style={{ fontSize: `${baseSize - 1}px` }}>
            {config.socialMediaHandle}
          </p>
        )}

        {config.footerText && (
          <p className="whitespace-pre-line opacity-70" style={{ fontSize: `${baseSize - 2}px` }}>
            {config.footerText}
          </p>
        )}

        {/* Visual Codes */}
        <div className="flex flex-col items-center gap-4 py-2">
          {config.showQrCode && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-24 h-24 bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-400 font-bold border border-zinc-300">
                QR CODE
              </div>
              {config.qrCodeTarget === 'survey' && <p className="text-[9px] uppercase tracking-tighter">Scan to Rate Us</p>}
            </div>
          )}

          {config.showBarcode && (
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="w-full h-8 bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-400 font-bold border border-zinc-300">
                |||||||| BARCODE ||||||||
              </div>
              <p className="text-[9px] font-mono">{order.orderNumber}</p>
            </div>
          )}
        </div>

        {config.showReturnPolicy && config.returnPolicyText && (
          <div className="pt-2">
            <p className="text-[10px] leading-tight opacity-70">{config.returnPolicyText}</p>
          </div>
        )}

        {config.showLegalDisclaimer && config.legalDisclaimerText && (
          <div className="pt-1">
            <p className="text-[9px] leading-tight italic opacity-60">{config.legalDisclaimerText}</p>
          </div>
        )}

        {config.showSignatureLine && (
          <div className="mt-8 pt-4 border-t border-black w-2/3 mx-auto">
            <p className="text-[10px] uppercase font-bold">{config.signatureLineText || 'SIGNATURE'}</p>
          </div>
        )}

        <p className="text-[9px] opacity-40 mt-4">
          NeoReceipts v2.0 - {format(new Date(), 'yyyy')}
        </p>
      </div>
    </div>
  );
}
