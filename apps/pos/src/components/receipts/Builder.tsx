import React, { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import {
  Settings,
  Layout,
  Type,
  FileText,
  Code,
  ChevronDown,
  ChevronRight,
  RefreshCcw,
  Check,
  Smartphone,
  CreditCard,
  User,
} from 'lucide-react';

// Import your existing components
// import { EnhancedThermalReceiptPDF } from './thermal-receipt';
import { ReceiptConfig, OrganizationData, PaymentData } from './types';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Card } from '../ui/card';

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      {...props}
      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    />
    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700 font-medium">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked ? 'bg-blue-600' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  </div>
);

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: value }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-24 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded font-mono"
      />
    </div>
  </div>
);

const AccordionItem = ({ title, icon: Icon, children, isOpen, onToggle }: any) => (
  <div className="border-b border-gray-100 last:border-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
      </div>
      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
    </button>
    {isOpen && <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
  </div>
);

// --- Initial Mock Data ---

const DEFAULT_CONFIG: ReceiptConfig = {
  width: 80, // mm
  padding: 10,
  spacing: 5,
  backgroundColor: '#FFFFFF',
  titleSize: 18,
  headerSize: 12,
  bodySize: 9,
  primaryColor: '#000000',
  secondaryColor: '#4B5563',
  showHeader: true,
  logoPosition: 'center',
  receiptTitle: 'RECEIPT',
  showReceiptNumber: true,
  showDateTime: true,
  showOrderType: true,
  showCustomerInfo: true,
  showItemsSection: true,
  showTotalsSection: true,
  showPaymentSection: true,
  showOrderNotes: true,
  showSpecialInstructions: true,
  currency: 'USD',
  locale: 'en-US',
  taxLabel: 'Tax',
  showPromoCode: true,
  showFooter: true,
  showPerforation: true,
  showDivider: true,
  dividerWidth: 1,
  showTax: true,
  showDiscount: true,
  showPaymentMethod: true,
  showAmountReceived: true,
  showChange: true,
  notesTitle: 'Notes',
  instructionsTitle: 'Instructions',
  promoCodeText: 'Promo Code Applied',
  thankYouMessage: 'Thank you for dining with us!',
  footerText: 'Powered by NeoReceipts',
  itemSpacing: 5,
};

const DEFAULT_ORG: OrganizationData = {
  name: 'Acme Bistro & Bar',
  address: '123 Culinary Avenue, Food District, NY 10012',
  phone: '+1 (555) 123-4567',
  email: 'hello@acmebistro.com',
  website: 'www.acmebistro.com',
  tagline: 'Taste the Excellence',
};

const DEFAULT_PAYMENT: PaymentData = {
  orderId: 'ORD-2023-8492',
  paymentMethod: 'card',
  amountPaid: 45.5,
  change: 0,
  customerName: 'Alex Richardson',
  customerPhone: '+1 (555) 987-6543',
};

// --- Main Builder Component ---

export default function ReceiptBuilderPage() {
  const [activeTab, setActiveTab] = useState<'design' | 'content'>('design');
  const [openSection, setOpenSection] = useState<string | null>('branding');

  // State for the Receipt
  const [config, setConfig] = useState<ReceiptConfig>(DEFAULT_CONFIG);
  const [organization, setOrganization] = useState<OrganizationData>(DEFAULT_ORG);
  // const [items] = useState<CartItem[]>(DEFAULT_ITEMS);
  const [payment, setPayment] = useState<PaymentData>(DEFAULT_PAYMENT);

  // Helper to update nested config
  const updateConfig = (key: keyof ReceiptConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const copyConfigJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert('Configuration JSON copied to clipboard!');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* --- LEFT SIDEBAR: CONFIGURATION --- */}
      <div className="w-[450px] flex flex-col bg-white border-r border-gray-200 shadow-xl z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Receipt Builder</h1>
          </div>
          <p className="text-gray-500 text-sm">Customize your thermal receipt layout.</p>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('design')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'design'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Design & Layout
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Data Content
          </button>
        </div>

        {/* Scrollable Settings Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {activeTab === 'design' ? (
            <div className="pb-10">
              {/* Branding Section */}
              <AccordionItem
                title="Branding & Organization"
                icon={Settings}
                isOpen={openSection === 'branding'}
                onToggle={() => setOpenSection(openSection === 'branding' ? null : 'branding')}
              >
                <div className="space-y-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input
                      value={organization.name}
                      onChange={e => setOrganization({ ...organization, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Logo Position</Label>
                    <Select value={config.logoPosition} onChange={e => updateConfig('logoPosition', e.target.value)}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </Select>
                  </div>
                  <ColorPicker
                    label="Primary Color"
                    value={config.primaryColor}
                    onChange={val => updateConfig('primaryColor', val)}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    value={config.secondaryColor}
                    onChange={val => updateConfig('secondaryColor', val)}
                  />
                </div>
              </AccordionItem>

              {/* Layout & Dimensions */}
              <AccordionItem
                title="Dimensions & Spacing"
                icon={Layout}
                isOpen={openSection === 'layout'}
                onToggle={() => setOpenSection(openSection === 'layout' ? null : 'layout')}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width (mm)</Label>
                      <Input
                        type="number"
                        value={config.width}
                        onChange={e => updateConfig('width', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Padding</Label>
                      <Input
                        type="number"
                        value={config.padding}
                        onChange={e => updateConfig('padding', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Spacing Density</Label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={config.spacing}
                      onChange={e => updateConfig('spacing', Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </AccordionItem>

              {/* Typography */}
              <AccordionItem
                title="Typography"
                icon={Type}
                isOpen={openSection === 'typography'}
                onToggle={() => setOpenSection(openSection === 'typography' ? null : 'typography')}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                        type="number"
                        value={config.titleSize}
                        onChange={e => updateConfig('titleSize', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Header</Label>
                      <Input
                        type="number"
                        value={config.headerSize}
                        onChange={e => updateConfig('headerSize', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Input
                        type="number"
                        value={config.bodySize}
                        onChange={e => updateConfig('bodySize', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </AccordionItem>

              {/* Sections & Toggles */}
              <AccordionItem
                title="Section Visibility"
                icon={Check}
                isOpen={openSection === 'visibility'}
                onToggle={() => setOpenSection(openSection === 'visibility' ? null : 'visibility')}
              >
                <div className="space-y-0 divide-y divide-gray-50">
                  <Toggle
                    label="Show Header"
                    checked={config.showHeader}
                    onChange={v => updateConfig('showHeader', v)}
                  />
                  <Toggle
                    label="Show Customer Info"
                    checked={config.showCustomerInfo}
                    onChange={v => updateConfig('showCustomerInfo', v)}
                  />
                  <Toggle
                    label="Show Items Section"
                    checked={config.showItemsSection}
                    onChange={v => updateConfig('showItemsSection', v)}
                  />
                  <Toggle
                    label="Show Divider Lines"
                    checked={config.showDivider}
                    onChange={v => updateConfig('showDivider', v)}
                  />
                  <Toggle
                    label="Show Payment Details"
                    checked={config.showPaymentSection}
                    onChange={v => updateConfig('showPaymentSection', v)}
                  />
                  <Toggle
                    label="Show Footer"
                    checked={config.showFooter}
                    onChange={v => updateConfig('showFooter', v)}
                  />
                  <Toggle
                    label="Show Paper Perforation"
                    checked={config.showPerforation}
                    onChange={v => updateConfig('showPerforation', v)}
                  />
                </div>
              </AccordionItem>

              {/* Labels */}
              <AccordionItem
                title="Text Labels"
                icon={FileText}
                isOpen={openSection === 'labels'}
                onToggle={() => setOpenSection(openSection === 'labels' ? null : 'labels')}
              >
                <div className="space-y-4">
                  <div>
                    <Label>Receipt Title</Label>
                    <Input value={config.receiptTitle} onChange={e => updateConfig('receiptTitle', e.target.value)} />
                  </div>
                  <div>
                    <Label>Footer Message</Label>
                    <Input value={config.footerText} onChange={e => updateConfig('footerText', e.target.value)} />
                  </div>
                  <div>
                    <Label>Thank You Message</Label>
                    <Input
                      value={config.thankYouMessage}
                      onChange={e => updateConfig('thankYouMessage', e.target.value)}
                    />
                  </div>
                </div>
              </AccordionItem>
            </div>
          ) : (
            <div className="p-6 space-y-6 pb-20">
              {/* Content Editor Tab */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer
                </h3>
                <div className="grid gap-4">
                  <Input
                    placeholder="Customer Name"
                    value={payment.customerName}
                    onChange={e => setPayment({ ...payment, customerName: e.target.value })}
                  />
                  <Input
                    placeholder="Customer Phone"
                    value={payment.customerPhone}
                    onChange={e => setPayment({ ...payment, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Info
                </h3>
                <div className="grid gap-4">
                  <Select
                    value={payment.paymentMethod}
                    onChange={e => setPayment({ ...payment, paymentMethod: e.target.value as any })}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile</option>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount Paid"
                    value={payment.amountPaid}
                    onChange={e => setPayment({ ...payment, amountPaid: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
          <button
            onClick={copyConfigJSON}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Code className="w-4 h-4" />
            Copy JSON
          </button>
          <button
            onClick={() => setConfig(DEFAULT_CONFIG)}
            className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Reset to Defaults"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- RIGHT SIDE: PREVIEW --- */}
      <div className="flex-1 bg-gray-100 flex flex-col h-screen">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Preview Mode
            </span>
          </div>

          {/* <PDFDownloadLink
            document={
              <EnhancedThermalReceiptPDF
                items={items}
                paymentData={payment}
                organization={organization}
                config={config}
                orderType="dine-in"
              />
            }
            fileName={`receipt-${payment.orderId}.pdf`}
          >
            {({ loading }) => (
              <button 
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all",
                  loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
                )}
              >
                <Download className="w-4 h-4" />
                {loading ? 'Generating...' : 'Download PDF'}
              </button>
            )}
          </PDFDownloadLink> */}
        </div>

        {/* PDF Stage */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
          <div className="absolute inset-0 pattern-grid-lg opacity-5 pointer-events-none" />

          <Card className="h-full w-full max-w-2xl bg-gray-500 shadow-2xl ring-8 ring-gray-200/50">
            <PDFViewer
              width="100%"
              height="100%"
              className="w-full h-full border-0"
              showToolbar={false} // Clean look
            >
              {/* <EnhancedThermalReceiptPDF
                  items={items}
                  paymentData={payment}
                  organization={organization}
                  config={config}
                  orderType="dine-in"
                  notes="Please handle with care"
                  promoCode="SUMMER2024"
                /> */}
            </PDFViewer>
          </Card>
        </div>
      </div>
    </div>
  );
}
