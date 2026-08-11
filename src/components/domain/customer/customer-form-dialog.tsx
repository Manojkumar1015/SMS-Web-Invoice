'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerFormSchema } from '@/lib/validations';
import { Customer, CustomerCreateInput } from '@/types/customer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { customerService } from '@/services';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerToEdit?: Customer | null;
  onSuccess: (customer: Customer) => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customerToEdit,
  onSuccess,
}: CustomerFormDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const defaultValues = React.useMemo<CustomerCreateInput>(
    () => ({
      customerType: customerToEdit?.customerType || 'business',
      companyName: customerToEdit?.companyName || '',
      displayName: customerToEdit?.displayName || '',
      contactPerson: customerToEdit?.contactPerson || '',
      email: customerToEdit?.email || '',
      phone: customerToEdit?.phone || '',
      gstin: customerToEdit?.gstin || '',
      pan: customerToEdit?.pan || '',
      paymentTerms: customerToEdit?.paymentTerms || 'Net 30',
      notes: customerToEdit?.notes || '',
      billingAddress: customerToEdit?.billingAddress || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      shippingAddress: customerToEdit?.shippingAddress || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      sameAsBillingAddress: customerToEdit?.sameAsBillingAddress ?? true,
      status: customerToEdit?.status || 'active',
    }),
    [customerToEdit]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerCreateInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const sameAsBilling = watch('sameAsBillingAddress');

  const onSubmit = async (data: CustomerCreateInput) => {
    setSubmitting(true);
    try {
      let saved: Customer;
      if (customerToEdit) {
        saved = await customerService.updateCustomer(customerToEdit.id, data);
      } else {
        saved = await customerService.createCustomer(data);
      }
      onSuccess(saved);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>{customerToEdit ? 'Edit Customer Profile' : 'Add New Customer'}</DrawerTitle>
          <DrawerDescription>
            Fill in business details, GSTIN, and billing addresses for invoicing.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DrawerBody className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
                <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent">
                  Billing Address
                </TabsTrigger>
                <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent">
                  Shipping Address
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Customer Type</label>
                    <Select
                      value={watch('customerType')}
                      onValueChange={(val) => setValue('customerType', val as 'business' | 'individual')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business (B2B)</SelectItem>
                        <SelectItem value="individual">Individual (B2C)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                    <Select
                      value={watch('status')}
                      onValueChange={(val) => setValue('status', val as 'active' | 'inactive')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Company Name</label>
                    <Input {...register('companyName')} error={errors.companyName?.message} placeholder="Acme Systems Ltd" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Display Name</label>
                    <Input {...register('displayName')} error={errors.displayName?.message} placeholder="Acme Systems" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Contact Person</label>
                    <Input {...register('contactPerson')} error={errors.contactPerson?.message} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Email</label>
                    <Input type="email" {...register('email')} error={errors.email?.message} placeholder="john@acme.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Phone</label>
                    <Input {...register('phone')} error={errors.phone?.message} placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">GSTIN</label>
                    <Input {...register('gstin')} placeholder="27AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">PAN Number</label>
                    <Input {...register('pan')} placeholder="AAAAA0000A" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Payment Terms</label>
                    <Select
                      value={watch('paymentTerms')}
                      onValueChange={(val) => setValue('paymentTerms', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Notes / Special Instructions</label>
                  <Textarea {...register('notes')} placeholder="Preferred invoice delivery instructions..." rows={3} />
                </div>
              </TabsContent>

              {/* Billing Address Tab */}
              <TabsContent value="billing" className="pt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Street Address</label>
                  <Input {...register('billingAddress.street')} error={errors.billingAddress?.street?.message} placeholder="Suite 102, Tech Park" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">City</label>
                    <Input {...register('billingAddress.city')} error={errors.billingAddress?.city?.message} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">State</label>
                    <Input {...register('billingAddress.state')} error={errors.billingAddress?.state?.message} placeholder="Maharashtra" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Postal Code</label>
                    <Input {...register('billingAddress.postalCode')} error={errors.billingAddress?.postalCode?.message} placeholder="400051" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Country</label>
                    <Input {...register('billingAddress.country')} error={errors.billingAddress?.country?.message} placeholder="India" />
                  </div>
                </div>
              </TabsContent>

              {/* Shipping Address Tab */}
              <TabsContent value="shipping" className="pt-4 space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    checked={sameAsBilling}
                    onChange={(e) => setValue('sameAsBillingAddress', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <label htmlFor="sameAsBilling" className="text-xs font-medium text-foreground cursor-pointer">
                    Shipping address is same as billing address
                  </label>
                </div>

                {!sameAsBilling && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">Street Address</label>
                      <Input {...register('shippingAddress.street')} placeholder="Warehouse 4, Industrial Area" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">City</label>
                        <Input {...register('shippingAddress.city')} placeholder="New Delhi" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">State</label>
                        <Input {...register('shippingAddress.state')} placeholder="Delhi" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">Postal Code</label>
                        <Input {...register('shippingAddress.postalCode')} placeholder="110020" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1 block">Country</label>
                        <Input {...register('shippingAddress.country')} placeholder="India" />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DrawerBody>

          <DrawerFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Save Customer'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
