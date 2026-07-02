'use client';

import { useState } from 'react';
import {
  MessageSquare,
  User,
  CalendarIcon,
  Building2,
  Briefcase,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { z } from 'zod';
import { CustomerFormSchema } from '@/lib/validation/customers';
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

type CustomerFormData = z.infer<typeof CustomerFormSchema>;

type ExtendedCustomer = Omit<Customer, 'address'> & {
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

    // Pharmacy Fields
    medicalHistory: (customer as any)?.medicalHistory || '',
    allergies: (customer as any)?.allergies || '',
    chronicConditions: (customer as any)?.chronicConditions || '',
    insuranceProvider: (customer as any)?.insuranceProvider || '',
    policyNumber: (customer as any)?.policyNumber || '',

    loyaltyPoints: customer?.loyaltyPoints || 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [activeTab, setActiveTab] = useState('details');

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => {
      const updates: any = { [name]: type === 'checkbox' ? checked : value };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = CustomerFormSchema.parse(formData);
      onSubmit({
        ...validatedData,
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
        setActiveTab('details');
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
          <TabsList className={cn('w-full grid', businessMode === 'pharmacy' ? 'grid-cols-2' : 'grid-cols-1')}>
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
          </TabsList>
        </div>

        {/* Tab Content: Details */}
        <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-8 mt-0">
          {/* Section 1: Personal Identity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-border">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg tracking-tight">Identity</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
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

              {/* Company Field */}
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

          {/* Section 3: Additional Info */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2 border-border">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg tracking-tight">Details & Notes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businessMode === 'pharmacy' && (
                <>
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
                </>
              )}

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
