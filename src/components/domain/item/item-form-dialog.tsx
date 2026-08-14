'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemFormSchema } from '@/lib/validations';
import { Item, ItemCreateInput } from '@/types/item';
import { ItemClassification, ITEM_CATEGORIES } from '@/types/classification';
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
import { useToast } from '@/hooks/use-toast';
import { Tag, Info } from 'lucide-react';

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
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [classifications, setClassifications] = React.useState<ItemClassification[]>([]);
  const [loadingClassifications, setLoadingClassifications] = React.useState(false);

  const initialType = itemToEdit?.itemType || (itemToEdit?.type === 'service' ? 'Service' : 'Product');

  const defaultValues = React.useMemo<ItemCreateInput>(
    () => ({
      name: itemToEdit?.name || '',
      sku: itemToEdit?.sku || '',
      type: (initialType === 'Service' ? 'service' : 'product') as any,
      itemType: initialType,
      category: itemToEdit?.category || 'Software',
      classificationId: itemToEdit?.classificationId || '',
      description: itemToEdit?.description || '',
      unit: itemToEdit?.unit || (initialType === 'Service' ? 'hrs' : 'pcs'),
      sellingPrice: itemToEdit?.sellingPrice || 0,
      purchasePrice: itemToEdit?.purchasePrice || 0,
      taxRate: itemToEdit?.taxRate || 18,
      hsnSac: itemToEdit?.hsnSac || '',
      discountRate: itemToEdit?.discountRate || 0,
      status: itemToEdit?.status || 'active',
    }),
    [itemToEdit, initialType]
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

  const selectedItemType = watch('itemType') || (watch('type') === 'service' ? 'Service' : 'Product');
  const selectedCategory = watch('category');
  const selectedClassificationId = watch('classificationId');

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
      setLoadingClassifications(true);
      fetch('/api/v1/item-classifications')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setClassifications(json.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingClassifications(false));
    }
  }, [open, reset, defaultValues]);

  // Filter classifications based on itemType (Product -> HSN, Service -> SAC)
  const targetClassificationType = selectedItemType === 'Product' ? 'HSN' : 'SAC';
  const availableClassifications = classifications.filter(
    (c) => c.classificationType === targetClassificationType
  );

  const selectedClassificationObj = classifications.find((c) => c.id === selectedClassificationId);

  const handleClassificationChange = (id: string) => {
    if (id === 'none') {
      setValue('classificationId', '');
      setValue('hsnSac', '');
    } else {
      setValue('classificationId', id);
      const matched = classifications.find((c) => c.id === id);
      if (matched) {
        setValue('hsnSac', matched.code);
      }
    }
  };

  const onSubmit = async (data: ItemCreateInput) => {
    setSubmitting(true);
    try {
      const payload: ItemCreateInput = {
        ...data,
        itemType: selectedItemType,
        type: selectedItemType === 'Service' ? 'service' : 'product',
        classificationId: data.classificationId || undefined,
        hsnSac: selectedClassificationObj?.code || data.hsnSac || undefined,
      };

      let saved: Item;
      if (itemToEdit) {
        saved = await itemService.updateItem(itemToEdit.id, payload);
      } else {
        saved = await itemService.createItem(payload);
      }
      onSuccess(saved);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error Saving Item', description: err?.message || 'Could not save item record.', variant: 'destructive' });
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
            Configure pricing, category, GST tax rate, and database-backed HSN/SAC classifications.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DrawerBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Item Type *</label>
                <Select
                  value={selectedItemType}
                  onValueChange={(val) => {
                    const newType = val as 'Product' | 'Service';
                    setValue('itemType', newType);
                    setValue('type', newType === 'Service' ? 'service' : 'product');
                    // Reset classification if switching between Product & Service
                    setValue('classificationId', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Category *</label>
                <Select
                  value={selectedCategory || 'Software'}
                  onValueChange={(val) => setValue('category', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Classification ({targetClassificationType})
              </label>
              {availableClassifications.length > 0 ? (
                <Select
                  value={selectedClassificationId || 'none'}
                  onValueChange={handleClassificationChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${targetClassificationType} Code`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Not Configured</SelectItem>
                    {availableClassifications.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.description} ({c.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>No {targetClassificationType} classifications configured yet.</span>
                </div>
              )}

              {selectedClassificationObj && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center space-x-2 font-mono font-bold text-indigo-700">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{selectedClassificationObj.code}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded uppercase font-sans">
                      {selectedClassificationObj.classificationType}
                    </span>
                  </div>
                  <div className="text-slate-600 font-medium">{selectedClassificationObj.description}</div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Item Name *</label>
              <Input {...register('name')} error={errors.name?.message} placeholder="e.g. Digital Camera / Graphic Design" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">SKU Code</label>
                <Input {...register('sku')} error={errors.sku?.message} placeholder="SKU-001" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Unit of Measure *</label>
                <Select
                  value={watch('unit') || 'pcs'}
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
                <label className="text-xs font-semibold text-foreground mb-1 block">Selling Price (₹) *</label>
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
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={watch('status') || 'active'}
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
