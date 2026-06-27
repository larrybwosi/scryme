'use client';

import { useState } from 'react';
import {
  MessageSquare,
  User,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CalendarIcon,
  CheckCircle2,
  X,
  Save,
  Building2,
  Briefcase,
  CreditCard,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Button } from '@repo/ui/components/ui/button';
import { Calendar } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { z } from 'zod';
import { AddressFormSchema, AddressType, CustomerFormSchema } from '@/lib/validation/customers';
import { Order } from '@/types';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string | null;
  address: string | null;
  isActive: boolean;
  loyaltyPoints: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string | null;
  organizationId: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  customerTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  preferredContactMethod?: 'email' | 'phone' | 'sms';
  orders?: Order[];
  billingAddress: any;
  shippingAddress: any;
}

type CustomerFormData = z.infer<typeof CustomerFormSchema> & {
  isBusiness?: boolean;
  taxId?: string;
};
type AddressFormData = z.infer<typeof AddressFormSchema>;

type ExtendedCustomer = Omit<Customer, 'address'> & {
  addresses?: (AddressFormData & { id?: string })[];
  businessAccount?: { taxId?: string | null }; // Assuming relational data might be present
  businessAccountId?: string | null;
  gender: string;
  customerType: string;
  dateOfBirth?: string;
  loyaltyTierId?: string;
  creationType?: string;
  deliveryNotes?: string;
};

export default function CustomerForm({
  customer,
  onSubmit,
  isPending,
  setAddModalOpen,
  setEditModalOpen,
}: {
  customer?: ExtendedCustomer | null;
  onSubmit: (data: CustomerFormData) => void;
  isPending: boolean;
  setAddModalOpen?: (open: boolean) => void;
  setEditModalOpen?: (open: boolean) => void;
}) {
  // --- Main Form State ---
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    notes: customer?.notes || '',
    isActive: customer?.isActive ?? true,
    gender: customer?.gender || '',
    customerType: customer?.customerType || '',
    dateOfBirth: customer?.dateOfBirth || '',
    loyaltyTierId: customer?.loyaltyTierId || undefined,
    deliveryNotes: customer?.deliveryNotes || '',
    avatar: customer?.avatar || '',
    // Business Fields
    isBusiness: !!customer?.businessAccountId,
    taxId: customer?.businessAccount?.taxId || '',

    // Pharmacy Fields
    medicalHistory: (customer as any)?.medicalHistory || '',
    allergies: (customer as any)?.allergies || '',
    chronicConditions: (customer as any)?.chronicConditions || '',
    insuranceProvider: (customer as any)?.insuranceProvider || '',
    policyNumber: (customer as any)?.policyNumber || '',

    addresses:
      customer?.addresses?.map(addr => ({
        ...addr,
        type: (addr.type as AddressType) || 'BOTH',
        latitude: addr.latitude ? Number(addr.latitude) : undefined,
        longitude: addr.longitude ? Number(addr.longitude) : undefined,
      })) || [],
    loyaltyPoints: customer?.loyaltyPoints || 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [activeTab, setActiveTab] = useState('details');

  // --- Address Editing State ---
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressIndex, setCurrentAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(defaultAddressValues());

  function defaultAddressValues(): AddressFormData {
    return {
      label: 'Home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      type: AddressType.BOTH,
      isDefault: false,
    };
  }

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => {
      const updates: any = { [name]: type === 'checkbox' ? checked : value };

      // Auto-switch customer type if Business is checked
      if (name === 'isBusiness' && checked) {
        updates.customerType = 'business';
      }

      return { ...prev, ...updates };
    });

    if (errors[name as keyof CustomerFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CustomerFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: date ? date.toISOString().split('T')[0] : '',
    }));
    if (errors.dateOfBirth) {
      setErrors(prev => ({ ...prev, dateOfBirth: undefined }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressSelectChange = (name: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  const openAddAddress = () => {
    setAddressForm(defaultAddressValues());
    setCurrentAddressIndex(null);
    setIsEditingAddress(true);
  };

  const openEditAddress = (index: number) => {
    const addr = formData.addresses?.[index];
    if (addr) {
      setAddressForm(addr);
      setCurrentAddressIndex(index);
      setIsEditingAddress(true);
    }
  };

  const saveAddress = () => {
    const result = AddressFormSchema.safeParse(addressForm);
    if (!result.success) {
      alert('Please fix address errors: ' + result.error.issues.map(i => i.message).join(', '));
      return;
    }

    setFormData(prev => {
      const newAddresses = [...(prev.addresses || [])];
      if (addressForm.isDefault) {
        newAddresses.forEach(a => (a.isDefault = false));
      }
      if (currentAddressIndex !== null) {
        newAddresses[currentAddressIndex] = addressForm;
      } else {
        newAddresses.push(addressForm);
      }
      return { ...prev, addresses: newAddresses };
    });

    setIsEditingAddress(false);
    setCurrentAddressIndex(null);
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = CustomerFormSchema.parse(formData);
      // Pass raw formData to ensure isBusiness/taxId are included if the schema hasn't been fully updated in the imported file yet
      onSubmit({
        ...validatedData,
        isBusiness: formData.isBusiness,
        taxId: formData.taxId,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        chronicConditions: formData.chronicConditions,
        insuranceProvider: formData.insuranceProvider,
        policyNumber: formData.policyNumber,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
        error.issues.forEach(issue => (newErrors[issue.path[0] as keyof CustomerFormData] = issue.message));
        setErrors(newErrors);

        // Auto-switch tab on error
        const addressErrors = error.issues.some(i => i.path[0] === 'addresses');
        if (addressErrors) setActiveTab('addresses');
        else setActiveTab('details');
      }
    }
  };

  const getDateObject = () => {
    return formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined;
  };

  const businessMode = import.meta.env.VITE_BUSINESS_MODE || 'retail';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background text-foreground mb-6">
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-6 pt-4 border-b border-border bg-background/50 backdrop-blur-sm z-10">
          <TabsList className={cn('w-full grid', businessMode === 'pharmacy' ? 'grid-cols-3' : 'grid-cols-2')}>
            <TabsTrigger value="details" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <User className="w-4 h-4 mr-2" /> Customer Details
            </TabsTrigger>
            {businessMode === 'pharmacy' && (
              <TabsTrigger
                value="medical"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Stethoscope className="w-4 h-4 mr-2" /> Medical Profile
              </TabsTrigger>
            )}
            <TabsTrigger
              value="addresses"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <MapPin className="w-4 h-4 mr-2" /> Address Book
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content: Details */}
        <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-8 mt-0">
          {/* Section 1: Personal & Business Identity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-border">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg tracking-tight">Identity & Business</h3>
              </div>

              {/* Is Business Toggle */}
              <div className="flex items-center space-x-2 bg-muted/40 px-3 py-1.5 rounded-full border">
                <input
                  id="isBusiness"
                  name="isBusiness"
                  type="checkbox"
                  checked={formData.isBusiness || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <Label htmlFor="isBusiness" className="cursor-pointer font-medium text-sm">
                  Business Account
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {formData.isBusiness ? 'Contact Person' : 'Full Name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Business Logic: Company & Tax ID */}
              {formData.isBusiness && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">
                      Registered Business Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        name="company"
                        value={formData.company || ''}
                        onChange={handleChange}
                        placeholder="Legal Entity Name"
                        className="pl-9 bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="taxId"
                        name="taxId"
                        value={formData.taxId || ''}
                        onChange={handleChange}
                        placeholder="e.g. US-123456789"
                        className="pl-9 bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Non-Business Company Field (if user just wants to tag a workplace without business account) */}
              {!formData.isBusiness && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      name="company"
                      value={formData.company || ''}
                      onChange={handleChange}
                      placeholder="Workplace"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Pharmacy Profile (Medical Tab) */}
          {businessMode === 'pharmacy' && (
            <TabsContent value="medical" className="flex-1 overflow-y-auto p-6 space-y-8 mt-0">
              <section className="space-y-4">
                <div className="flex items-center space-x-2 border-b pb-2 border-border">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg tracking-tight">Patient Profile</h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      name="allergies"
                      value={formData.allergies || ''}
                      onChange={handleChange}
                      placeholder="List any known drug or food allergies..."
                      rows={2}
                      className="resize-none bg-background border-destructive/20 focus-visible:ring-destructive"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                    <Textarea
                      id="chronicConditions"
                      name="chronicConditions"
                      value={formData.chronicConditions || ''}
                      onChange={handleChange}
                      placeholder="Hypertension, Diabetes, etc."
                      rows={2}
                      className="resize-none bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory">General Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      name="medicalHistory"
                      value={formData.medicalHistory || ''}
                      onChange={handleChange}
                      placeholder="Previous surgeries, hospitalizations, etc."
                      rows={3}
                      className="resize-none bg-background"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center space-x-2 border-b pb-2 border-border">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg tracking-tight">Insurance Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      name="insuranceProvider"
                      value={formData.insuranceProvider || ''}
                      onChange={handleChange}
                      placeholder="e.g. Aetna, Blue Cross"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number</Label>
                    <Input
                      id="policyNumber"
                      name="policyNumber"
                      value={formData.policyNumber || ''}
                      onChange={handleChange}
                      placeholder="ID / Policy #"
                      className="bg-background"
                    />
                  </div>
                </div>
              </section>
            </TabsContent>
          )}

          {/* Section 3: Additional Info */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2 border-border">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">Details & Notes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Type</Label>
                <Select
                  value={formData.customerType || ''}
                  onValueChange={val => handleSelectChange('customerType', val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender || ''} onValueChange={val => handleSelectChange('gender', val)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-background',
                        !formData.dateOfBirth && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOfBirth ? format(getDateObject()!, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={getDateObject()}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={date => date > new Date() || date < new Date('1900-01-01')}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  name="avatar"
                  value={formData.avatar || ''}
                  onChange={handleChange}
                  placeholder="https://image.com/avatar.png"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Add internal remarks here..."
                  rows={3}
                  className="resize-none bg-background"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryNotes">Delivery Instructions</Label>
                <Textarea
                  id="deliveryNotes"
                  name="deliveryNotes"
                  value={formData.deliveryNotes || ''}
                  onChange={handleChange}
                  placeholder="Gate codes, specific landmarks, etc."
                  rows={2}
                  className="resize-none bg-background"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="cursor-pointer font-medium">
                      Active Customer Account
                    </Label>
                    <p className="text-xs text-muted-foreground">Uncheck to disable access for this customer.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* Tab Content: Addresses */}
        <TabsContent value="addresses" className="flex-1 overflow-y-auto p-6 mt-0">
          <section className="space-y-4 pb-4">
            <div className="flex items-center justify-between border-b pb-2 border-border">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg tracking-tight">Address Book</h3>
              </div>
              {!isEditingAddress && (
                <Button type="button" variant="secondary" size="sm" onClick={openAddAddress}>
                  <Plus className="mr-2 h-4 w-4" /> Add New
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Address List View */}
              {!isEditingAddress && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {formData.addresses?.map((addr, idx) => (
                    <Card
                      key={idx}
                      className="group relative overflow-hidden border transition-all hover:shadow-md dark:hover:border-primary/50"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm bg-muted px-2 py-0.5 rounded text-foreground">
                              {addr.label || 'Address'}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center border border-primary/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Default
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditAddress(idx)}
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeAddress(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>{addr.street1}</p>
                          {addr.street2 && <p>{addr.street2}</p>}
                          <p>
                            {addr.city}, {addr.country}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground">{addr.type}</span>
                          <span className="text-[10px] text-muted-foreground">{addr.postalCode}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {formData.addresses?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed rounded-lg bg-muted/10">
                      <MapPin className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No addresses added yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit/Add Address Form */}
              {isEditingAddress && (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                    <h4 className="font-medium text-sm">
                      {currentAddressIndex !== null ? 'Edit Address' : 'New Address'}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsEditingAddress(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Address Label</Label>
                      <Input
                        name="label"
                        value={addressForm.label || ''}
                        onChange={handleAddressChange}
                        placeholder="Home, Office..."
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Type</Label>
                      <Select value={addressForm.type} onValueChange={val => handleAddressSelectChange('type', val)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOTH">Shipping & Billing</SelectItem>
                          <SelectItem value="SHIPPING">Shipping Only</SelectItem>
                          <SelectItem value="BILLING">Billing Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>
                        Street Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        name="street1"
                        value={addressForm.street1}
                        onChange={handleAddressChange}
                        placeholder="123 Main St"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Apartment / Suite</Label>
                      <Input
                        name="street2"
                        value={addressForm.street2 || ''}
                        onChange={handleAddressChange}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State / Prov</Label>
                      <Input
                        name="state"
                        value={addressForm.state || ''}
                        onChange={handleAddressChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        name="postalCode"
                        value={addressForm.postalCode || ''}
                        onChange={handleAddressChange}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Country <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressChange}
                        className="bg-background"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isDefault"
                        id="addrIsDefault"
                        checked={addressForm.isDefault}
                        onChange={handleAddressChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <Label htmlFor="addrIsDefault" className="cursor-pointer">
                        Set as default address
                      </Label>
                    </div>
                  </div>

                  <div className="p-4 border-t bg-muted/30 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditingAddress(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={saveAddress}>
                      <Save className="w-4 h-4 mr-2" /> {currentAddressIndex !== null ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Footer Actions - Sticky Bottom */}
      <div className="sticky bottom-0 z-20 bg-background/80 backdrop-blur-md border-t p-2 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (customer ? setEditModalOpen?.(false) : setAddModalOpen?.(false))}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : customer ? 'Save Changes' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}
