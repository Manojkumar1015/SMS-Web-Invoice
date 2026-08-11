'use client';

import * as React from 'react';
import { Quote } from '@/types/quote';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { quoteService } from '@/services';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface ConvertQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onSuccess?: (invoiceId: string) => void;
}

export function ConvertQuoteDialog({
  open,
  onOpenChange,
  quote,
  onSuccess,
}: ConvertQuoteDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [converting, setConverting] = React.useState(false);

  const handleConvert = async () => {
    setConverting(true);
    try {
      const invoiceId = await quoteService.convertToInvoice(quote.id);
      toast({
        title: 'Quote Converted!',
        description: `Successfully generated invoice from ${quote.quoteNumber}.`,
        variant: 'success',
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(invoiceId);
      } else {
        router.push(`/app/invoices/${invoiceId}`);
      }
    } catch {
      toast({
        title: 'Conversion Failed',
        description: 'Unable to convert quote into invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            <DialogTitle>Convert Quote into Invoice?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            This will mark Quote <span className="font-semibold text-slate-900">{quote.quoteNumber}</span> as Accepted/Converted and automatically issue a new Invoice with pre-populated line items.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 mt-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold text-slate-900">{quote.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Item Count:</span>
            <span className="font-medium text-slate-800">{quote.items.length} line item(s)</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
            <span>Invoice Total:</span>
            <CurrencyDisplay amount={quote.total} className="text-indigo-600" />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={converting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConvert} disabled={converting} className="bg-indigo-600 hover:bg-indigo-700">
            {converting ? 'Converting...' : (
              <>
                Convert to Invoice <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
