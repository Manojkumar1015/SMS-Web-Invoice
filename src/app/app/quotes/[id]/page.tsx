'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quoteService } from '@/services';
import { Quote } from '@/types/quote';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DocumentPreview } from '@/components/domain/document/document-preview';
import { ConvertQuoteDialog } from '@/components/domain/quote/convert-quote-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { QuoteStatusBadge } from '@/components/domain/quote/quote-status-badge';
import { DocumentNumber } from '@/components/ui/document-number';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Edit, Copy, Download, Printer, Send, CheckCircle, XCircle, ArrowRight, ArrowLeft, History, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { SendDocumentDialog } from '@/components/domain/document/send-document-dialog';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quoteId = params.id as string;

  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);

  const loadQuote = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = await quoteService.getQuoteById(quoteId);
      setQuote(q);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  React.useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  const handleStatusChange = async (newStatus: 'accepted' | 'declined' | 'sent') => {
    if (!quote) return;
    try {
      await quoteService.updateQuote(quote.id, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Quote ${quote.quoteNumber} status marked as ${newStatus}.`,
        variant: 'success',
      });
      loadQuote();
    } catch {
      toast({ title: 'Error', description: 'Could not update quote status.', variant: 'destructive' });
    }
  };

  const handleDuplicate = async () => {
    if (!quote) return;
    try {
      const dup = await quoteService.duplicateQuote(quote.id);
      toast({ title: 'Quote Duplicated', description: `Created draft ${dup.quoteNumber}.`, variant: 'success' });
      router.push(`/app/quotes/${dup.id}`);
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate quote.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingState message="Loading quotation details..." />;
  }

  if (!quote) {
    return (
      <ErrorState
        title="Quote Not Found"
        description="The quotation document you requested could not be located."
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/app/quotes')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Quotes
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quote ${quote.quoteNumber}`}
        subtitle={`Created for ${quote.customerName}`}
        breadcrumbs={[
          { label: 'Quotes', href: '/app/quotes' },
          { label: quote.quoteNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/quotes')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/app/quotes/${quote.id}/edit`)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-1" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print / PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSendDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
            {quote.status !== 'accepted' && quote.status !== 'converted' && (
              <Button variant="outline" size="sm" onClick={() => handleStatusChange('accepted')} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                <CheckCircle className="h-4 w-4 mr-1" /> Accept
              </Button>
            )}
            {quote.status !== 'declined' && quote.status !== 'converted' && (
              <Button variant="outline" size="sm" onClick={() => handleStatusChange('declined')} className="text-red-700 border-red-300 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-1" /> Decline
              </Button>
            )}
            {quote.status !== 'converted' && (
              <Button size="sm" onClick={() => setConvertDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <ArrowRight className="h-4 w-4 mr-1" /> Convert to Invoice
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quote Ref</span>
          <div className="mt-1">
            <DocumentNumber number={quote.quoteNumber} type="quote" />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
          <div className="mt-1">
            <QuoteStatusBadge status={quote.status} />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiry Date</span>
          <div className="mt-1 text-sm font-semibold text-slate-800">
            <DateDisplay date={quote.expiryDate} />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
          <div className="mt-1 text-base font-extrabold text-indigo-700">
            <CurrencyDisplay amount={quote.total} />
          </div>
        </div>
      </div>

      {/* Main Document Display */}
      <DocumentPreview documentType="Quote" documentData={quote} />

      {/* Activity Timeline Section */}
      <Card className="max-w-4xl mx-auto border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <History className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Activity History</h3>
          </div>

          <div className="space-y-4 pl-2">
            {(quote.activities && quote.activities.length > 0 ? quote.activities : [
              {
                id: 'act-1',
                title: 'Quote Created',
                description: `Created quote for ${quote.customerName}`,
                timestamp: quote.createdAt,
                actor: 'Admin User',
                type: 'created',
              },
            ]).map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs">
                <div className="mt-0.5 rounded-full p-1 bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Clock className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <DateDisplay date={act.timestamp} showTime className="text-[11px] text-slate-400" />
                  </div>
                  <p className="text-slate-600 mt-0.5">{act.description}</p>
                  {act.actor && <span className="text-[10px] text-slate-400 block mt-0.5">By {act.actor}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Convert Quote Confirmation Dialog */}
      {convertDialogOpen && (
        <ConvertQuoteDialog
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          quote={quote}
          onSuccess={(invId) => router.push(`/app/invoices/${invId}`)}
        />
      )}
    </div>
  );
}
