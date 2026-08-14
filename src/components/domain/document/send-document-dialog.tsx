'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Mail, MessageSquare, Download, ExternalLink, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/currency-display';

export interface SendDocumentData {
  id: string;
  type: 'Invoice' | 'Quote';
  number: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
}

interface SendDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: SendDocumentData | null;
  onSuccessRedirect?: () => void;
}

export function SendDocumentDialog({
  open,
  onOpenChange,
  document,
  onSuccessRedirect,
}: SendDocumentDialogProps) {
  const isInvoice = document?.type === 'Invoice';
  const cleanPhone = (document?.customerPhone || '').replace(/[^0-9+]/g, '');

  const [emailTo, setEmailTo] = React.useState(document?.customerEmail || '');
  const [emailSubject, setEmailSubject] = React.useState(
    document ? `${document.type} ${document.number} from SMS Billing` : ''
  );
  const [emailBody, setEmailBody] = React.useState(
    document
      ? `Dear ${document.customerName},\n\nPlease find attached ${document.type} ${document.number} for ₹${document.total.toLocaleString('en-IN')}.\n\nYou can view and download your document online:\n${typeof window !== 'undefined' ? window.location.origin : ''}/app/${isInvoice ? 'invoices' : 'quotes'}/${document.id}\n\nThank you for your business!`
      : ''
  );

  const [whatsappPhone, setWhatsappPhone] = React.useState(cleanPhone);
  const [whatsappMessage, setWhatsappMessage] = React.useState(
    document
      ? `Hello ${document.customerName}, here is your ${document.type} *${document.number}* for *₹${document.total.toLocaleString('en-IN')}*.\n\nView or download your document here:\n${typeof window !== 'undefined' ? window.location.origin : ''}/app/${isInvoice ? 'invoices' : 'quotes'}/${document.id}`
      : ''
  );

  React.useEffect(() => {
    if (document) {
      const inv = document.type === 'Invoice';
      setEmailTo(document.customerEmail || '');
      setEmailSubject(`${document.type} ${document.number} from SMS Billing`);
      setEmailBody(
        `Dear ${document.customerName},\n\nPlease find attached ${document.type} ${document.number} for ₹${document.total.toLocaleString('en-IN')}.\n\nYou can view and download your document online:\n${typeof window !== 'undefined' ? window.location.origin : ''}/app/${inv ? 'invoices' : 'quotes'}/${document.id}\n\nThank you for your business!`
      );
      setWhatsappPhone((document.customerPhone || '').replace(/[^0-9+]/g, ''));
      setWhatsappMessage(
        `Hello ${document.customerName}, here is your ${document.type} *${document.number}* for *₹${document.total.toLocaleString('en-IN')}*.\n\nView or download your document here:\n${typeof window !== 'undefined' ? window.location.origin : ''}/app/${inv ? 'invoices' : 'quotes'}/${document.id}`
      );
    }
  }, [document]);

  if (!document) return null;

  const handleOpenEmailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleOpenWhatsapp = () => {
    const phoneToUse = whatsappPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${phoneToUse}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadPdf = () => {
    const pdfUrl = `/api/v1/${isInvoice ? 'invoices' : 'quotes'}/${document.id}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onSuccessRedirect) {
      onSuccessRedirect();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
              {isInvoice ? 'INV' : 'QUO'}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Send {document.type} {document.number}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Billed to {document.customerName} • Total: ₹{document.total.toLocaleString('en-IN')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="email" className="text-xs font-bold flex items-center justify-center space-x-2">
              <Mail className="h-3.5 w-3.5" />
              <span>Email / Gmail</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs font-bold flex items-center justify-center space-x-2">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 pt-3">
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-800 text-xs font-bold">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Integration Boundary Notice</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Direct automated Gmail API/OAuth sending is not configured in settings.
                Clicking <strong>Send via Email Client</strong> will launch your system email app with pre-filled details.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Email *</label>
                <Input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="customer@domain.com"
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Body</label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  className="text-xs font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
              </Button>
              <Button
                type="button"
                onClick={handleOpenEmailClient}
                disabled={!emailTo.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Send via Email Client
              </Button>
            </div>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-4 pt-3">
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>WhatsApp Messaging Flow</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Clicking <strong>Open WhatsApp</strong> launches WhatsApp Web or Desktop App with the customer&apos;s phone number and message pre-filled. Delivery is handled inside WhatsApp.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Phone Number *</label>
                <Input
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="text-xs font-mono"
                />
                {!whatsappPhone && (
                  <span className="text-[10px] text-amber-600 mt-1 block">
                    No phone number found on customer profile. Please enter a valid mobile number with country code.
                  </span>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message Preview</label>
                <Textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={4}
                  className="text-xs font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
              </Button>
              <Button
                type="button"
                onClick={handleOpenWhatsapp}
                disabled={!whatsappPhone.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open WhatsApp
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 border-t border-slate-200 pt-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="w-full sm:w-auto text-xs font-bold">
            Done / Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
