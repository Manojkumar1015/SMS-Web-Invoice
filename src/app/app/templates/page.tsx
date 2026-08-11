'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { templateService } from '@/services';
import { InvoiceTemplate } from '@/types/template';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { TemplatePreviewCard } from '@/components/domain/template/template-preview-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { mockInvoices } from '@/data/mockInvoices';
import { LoadingState } from '@/components/ui/loading-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Sparkles, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<InvoiceTemplate[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [previewTemplate, setPreviewTemplate] = React.useState<InvoiceTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = React.useState<string | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await templateService.getTemplates({
        search,
        status: statusFilter,
      });
      setTemplates(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await templateService.setDefaultTemplate(id);
      toast({
        title: 'Default Template Updated',
        description: `Set "${updated.name}" as default invoice theme.`,
        variant: 'success',
      });
      fetchTemplates();
    } catch {
      toast({ title: 'Error', description: 'Could not update default template.', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await templateService.duplicateTemplate(id);
      toast({
        title: 'Template Duplicated',
        description: `Created custom copy "${dup.name}".`,
        variant: 'success',
      });
      fetchTemplates();
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate template.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplateId) return;
    try {
      await templateService.deleteTemplate(deletingTemplateId);
      toast({ title: 'Template Deleted', description: 'Custom template removed.', variant: 'info' });
      setDeletingTemplateId(null);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message || 'Cannot delete template.', variant: 'destructive' });
      setDeletingTemplateId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Templates"
        subtitle="Create and customize professional invoice designs for your business."
        actions={
          <Button size="sm" onClick={() => router.push('/app/templates/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            + Create Template
          </Button>
        }
      />

      {/* Filter Tabs */}
      <FilterBar
        options={[
          { value: 'all', label: 'All Templates' },
          { value: 'custom', label: 'My Custom Templates' },
          { value: 'system', label: 'System Templates' },
          { value: 'default', label: 'Active Default' },
        ]}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search templates by name, layout category, font..." />
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <LoadingState message="Loading invoice templates..." />
      ) : templates.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Layers className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Templates Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No templates matching your search criteria were found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tmpl) => (
            <TemplatePreviewCard
              key={tmpl.id}
              template={tmpl}
              onSetDefault={handleSetDefault}
              onDuplicate={handleDuplicate}
              onDelete={(id) => setDeletingTemplateId(id)}
              onPreview={(t) => setPreviewTemplate(t)}
            />
          ))}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <DialogTitle>{previewTemplate.name} — Full Preview</DialogTitle>
              </div>
            </DialogHeader>

            <div className="py-4">
              <DocumentRenderer
                documentType="Invoice"
                documentData={mockInvoices[0]}
                templateConfig={previewTemplate.config}
                sampleMode={true}
              />
            </div>

            <DialogFooter className="flex justify-between items-center w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = previewTemplate.id;
                  setPreviewTemplate(null);
                  router.push(`/app/templates/${id}/edit`);
                }}
              >
                Customize Layout
              </Button>
              <Button size="sm" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Dialog */}
      {deletingTemplateId && (
        <ConfirmDialog
          open={!!deletingTemplateId}
          onOpenChange={(open) => !open && setDeletingTemplateId(null)}
          title="Delete Custom Template?"
          description="Are you sure you want to permanently remove this custom template? This action cannot be undone."
          confirmLabel="Delete Template"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
