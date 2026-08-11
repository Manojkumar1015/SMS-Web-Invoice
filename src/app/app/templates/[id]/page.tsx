'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { templateService } from '@/services';
import { InvoiceTemplate } from '@/types/template';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { mockInvoices } from '@/data/mockInvoices';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { ArrowLeft, Edit, Copy, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();

  const [template, setTemplate] = React.useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchTemplate = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await templateService.getTemplateById(id);
      setTemplate(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleSetDefault = async () => {
    if (!template) return;
    try {
      await templateService.setDefaultTemplate(template.id);
      toast({ title: 'Default Template Saved', description: `Set "${template.name}" as active default.`, variant: 'success' });
      fetchTemplate();
    } catch {
      toast({ title: 'Error', description: 'Could not update default status.', variant: 'destructive' });
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    try {
      const dup = await templateService.duplicateTemplate(template.id);
      toast({ title: 'Template Duplicated', description: `Created copy "${dup.name}".`, variant: 'success' });
      router.push(`/app/templates/${dup.id}/edit`);
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate template.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingState message="Loading template preview..." />;
  }

  if (!template) {
    return (
      <ErrorState
        title="Template Not Found"
        description="The requested invoice template does not exist."
        action={
          <Button onClick={() => router.push('/app/templates')} className="mt-4">
            Back to Templates
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        subtitle={template.description}
        breadcrumbs={[
          { label: 'Templates', href: '/app/templates' },
          { label: template.name },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/templates')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            {!template.isDefault && (
              <Button variant="outline" size="sm" onClick={handleSetDefault}>
                <Check className="h-4 w-4 mr-1.5" /> Set as Default
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-1.5" /> Duplicate
            </Button>
            <Button size="sm" onClick={() => router.push(`/app/templates/${template.id}/edit`)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Edit className="h-4 w-4 mr-1.5" /> Customize Layout
            </Button>
          </div>
        }
      />

      <div className="py-4 bg-slate-100/80 rounded-2xl border border-slate-200 shadow-inner">
        <DocumentRenderer
          documentType="Invoice"
          documentData={mockInvoices[0]}
          templateConfig={template.config}
          sampleMode={true}
        />
      </div>
    </div>
  );
}
