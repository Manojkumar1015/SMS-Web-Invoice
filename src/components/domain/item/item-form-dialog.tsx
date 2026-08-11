'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemFormSchema } from '@/lib/validations';
import { Item, ItemCreateInput } from '@/types/item';
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
import { itemService } from '@/services';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: Item | null;
  onSuccess: (item: Item) => void;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSuccess,
}: ItemFormDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const defaultValues = React.useMemo<ItemCreateInput>(
    () => ({
      name: itemToEdit?.name || '',
      sku: itemToEdit?.sku || '',
      type: itemToEdit?.type || 'service',
      description: itemToEdit?.description || '',
      unit: itemToEdit?.unit || 'hrs',
      sellingPrice: itemToEdit?.sellingPrice || 0,
      purchasePrice: itemToEdit?.purchasePrice || 0,
      taxRate: itemToEdit?.taxRate || 18,
      hsnSac: itemToEdit?.hsnSac || '',
      discountRate: itemToEdit?.discountRate || 0,
      status: itemToEdit?.status || 'active',
    }),
    [itemToEdit]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ItemCreateInput>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onSubmit = async (data: ItemCreateInput) => {
    setSubmitting(true);
    try {
      let saved: Item;
      if (itemToEdit) {
        saved = await itemService.updateItem(itemToEdit.id, data);
      } else {
        saved = await itemService.createItem(data);
      }
      onSuccess(saved);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{itemToEdit ? 'Edit Catalog Item' : 'New Product or Service'}</DrawerTitle>
          <DrawerDescription>
            Configure pricing, tax rate percentage, and HSN/SAC codes.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DrawerBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Item Type</label>
                <Select
                  value={watch('type')}
                  onValueChange={(val) => setValue('type', val as 'product' | 'service')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
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

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Item Name</label>
              <Input {...register('name')} error={errors.name?.message} placeholder="e.g. Cloud Hosting Maintenance" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">SKU Code</label>
                <Input {...register('sku')} error={errors.sku?.message} placeholder="SRV-CLOUD-01" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Unit of Measure</label>
                <Select
                  value={watch('unit')}
                  onValueChange={(val) => setValue('unit', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hrs">Hours (hrs)</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="month">Month (month)</SelectItem>
                    <SelectItem value="project">Project (project)</SelectItem>
                    <SelectItem value="pack">Pack (pack)</SelectItem>
                    <SelectItem value="box">Box (box)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Selling Price (₹)</label>
                <Input type="number" step="any" {...register('sellingPrice')} error={errors.sellingPrice?.message} />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Cost Price (₹)</label>
                <Input type="number" step="any" {...register('purchasePrice')} placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Tax Rate (% GST)</label>
                <Select
                  value={String(watch('taxRate'))}
                  onValueChange={(val) => setValue('taxRate', Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exempt)</SelectItem>
                    <SelectItem value="5">5% GST</SelectItem>
                    <SelectItem value="12">12% GST</SelectItem>
                    <SelectItem value="18">18% GST (Standard)</SelectItem>
                    <SelectItem value="28">28% GST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">HSN / SAC Code</label>
                <Input {...register('hsnSac')} placeholder="e.g. 998315" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Description</label>
              <Textarea {...register('description')} placeholder="Detailed scope or specification..." rows={3} />
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : itemToEdit ? 'Update Item' : 'Save Item'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
