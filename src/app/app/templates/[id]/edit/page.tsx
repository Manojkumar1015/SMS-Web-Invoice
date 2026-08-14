'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { templateService } from '@/services';
import { InvoiceTemplate, TemplateConfiguration } from '@/types/template';
import { TemplateEditorToolbar } from '@/components/domain/template/template-editor-toolbar';
import { TemplateCustomizerPanel } from '@/components/domain/template/template-customizer-panel';
import { TemplateLiveCanvas } from '@/components/domain/template/template-live-canvas';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TemplateStudioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();

  const [template, setTemplate] = React.useState<InvoiceTemplate | null>(null);
  const [config, setConfig] = React.useState<TemplateConfiguration | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = React.useState<TemplateConfiguration[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  const fetchTemplate = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await templateService.getTemplateById(id);
      if (data) {
        setTemplate(data);
        setConfig(data.config);
        setHistory([JSON.parse(JSON.stringify(data.config))]);
        setHistoryIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleConfigChange = (updated: TemplateConfiguration) => {
    setConfig(updated);
    // Push into undo stack
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(updated)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setConfig(JSON.parse(JSON.stringify(history[prevIdx])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setConfig(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  };

  const handleSave = async () => {
    if (!template || !config) return;
    setSubmitting(true);
    try {
      const updated = await templateService.updateTemplate(template.id, {
        name: config.name,
        description: config.description,
        config,
      });
      setTemplate(updated);
      setConfig(updated.config);
      toast({ title: 'Template Saved Successfully', description: `Saved changes to "${updated.name}".`, variant: 'success' });
      if (updated.id !== template.id) {
        router.replace(`/app/templates/${updated.id}/edit`);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not save template changes.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!config) return;
    setSubmitting(true);
    try {
      const newName = `${config.name} (Copy)`;
      const newConfig = { ...config, name: newName };
      const created = await templateService.createTemplate({
        name: newName,
        description: config.description,
        category: config.category,
        isSystem: false,
        isDefault: false,
        config: newConfig,
      });
      toast({ title: 'Saved as New Template', description: `Created "${created.name}".`, variant: 'success' });
      router.push(`/app/templates/${created.id}/edit`);
    } catch {
      toast({ title: 'Error', description: 'Could not save as new template.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    try {
      const dup = await templateService.duplicateTemplate(template.id);
      toast({ title: 'Template Duplicated', description: `Created "${dup.name}".`, variant: 'success' });
      router.push(`/app/templates/${dup.id}/edit`);
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate template.', variant: 'destructive' });
    }
  };

  const handleSetDefault = async () => {
    if (!template) return;
    try {
      await templateService.setDefaultTemplate(template.id);
      toast({ title: 'Set as Default Template', description: `Template "${template.name}" is now the active default.`, variant: 'success' });
      fetchTemplate();
    } catch {
      toast({ title: 'Error', description: 'Could not set default template.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingState message="Launching Invoice Template Studio..." />;
  }

  if (!template || !config) {
    return (
      <ErrorState
        title="Template Not Found"
        description="The requested template could not be loaded into Template Studio."
        action={
          <Button onClick={() => router.push('/app/templates')} className="mt-4">
            Back to Templates
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-900 -m-4 sm:-m-6">
      {/* Top Toolbar */}
      <TemplateEditorToolbar
        templateName={config.name}
        onNameChange={(name) => handleConfigChange({ ...config, name })}
        onSave={handleSave}
        onSaveAsNew={handleSaveAsNew}
        onDuplicate={handleDuplicate}
        onSetDefault={handleSetDefault}
        isDefault={template.isDefault}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        submitting={submitting}
      />

      {/* 2-Panel Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Customizer Accordion Panel */}
        <TemplateCustomizerPanel config={config} onChange={handleConfigChange} />

        {/* Live A4 Preview Canvas */}
        <TemplateLiveCanvas config={config} />
      </div>
    </div>
  );
}
