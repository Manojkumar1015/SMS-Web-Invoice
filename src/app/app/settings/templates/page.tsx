'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { templateService } from '@/services';
import { InvoiceTemplate } from '@/types/template';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TemplatePreviewCard } from '@/components/domain/template/template-preview-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { mockInvoices } from '@/data/mockInvoices';
import { LoadingState } from '@/components/ui/loading-state';
import { Palette, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TemplateSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [previewTemplate, setPreviewTemplate] = React.useState<InvoiceTemplate | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await templateService.getTemplates();
      setTemplates(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await templateService.setDefaultTemplate(id);
      toast({
        title: 'Default Template Updated',
        description: `Set "${updated.name}" as primary default invoice theme.`,
        variant: 'success',
      });
      fetchTemplates();
    } catch {
      toast({ title: 'Error', description: 'Could not set default template.', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await templateService.duplicateTemplate(id);
      toast({ title: 'Template Duplicated', description: `Created "${dup.name}".`, variant: 'success' });
      fetchTemplates();
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate template.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      toast({ title: 'Template Deleted', description: 'Template removed.', variant: 'info' });
      fetchTemplates();
    } catch {
      toast({ title: 'Error', description: 'Could not delete template.', variant: 'destructive' });
    }
  };

  if (loading) return <LoadingState message="Loading templates..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage business details, invoice numbering, tax configurations, and team roles."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNavigation />

        <div className="flex-1 space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Invoice & Document Templates Studio</CardTitle>
                </div>
                <CardDescription>Select default document theme or customize design, colors, fonts, and headers.</CardDescription>
              </div>

              <Button size="sm" onClick={() => router.push('/app/templates/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> Create Template
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((tpl) => (
                  <TemplatePreviewCard
                    key={tpl.id}
                    template={tpl}
                    onSetDefault={handleSetDefault}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onPreview={(t) => setPreviewTemplate(t)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>{previewTemplate.name} Preview</span>
              </DialogTitle>
            </DialogHeader>

            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
              <DocumentRenderer
                documentType="Invoice"
                documentData={mockInvoices[0]}
                templateConfig={previewTemplate.config}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
