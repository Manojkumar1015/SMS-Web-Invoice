'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Copy, RotateCcw, RotateCw, Check, Sparkles, Eye } from 'lucide-react';

interface TemplateEditorToolbarProps {
  templateName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onSaveAsNew: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  isDefault: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  submitting?: boolean;
}

export function TemplateEditorToolbar({
  templateName,
  onNameChange,
  onSave,
  onSaveAsNew,
  onDuplicate,
  onSetDefault,
  isDefault,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  submitting = false,
}: TemplateEditorToolbarProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shadow-md">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/templates')}
          className="text-slate-300 hover:text-white hover:bg-slate-800 h-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Templates
        </Button>

        <div className="h-4 w-px bg-slate-700 hidden sm:block" />

        <div className="flex items-center space-x-2">
          <Input
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-8 text-xs font-bold bg-slate-800 border-slate-700 text-white w-48 sm:w-64 focus:ring-indigo-500"
            placeholder="Template Name"
          />
          {isDefault && (
            <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shrink-0">
              <Sparkles className="h-3 w-3 mr-1" /> Default
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Undo / Redo controls */}
        {onUndo && (
          <Button
            variant="ghost"
            size="icon"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo"
            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {onRedo && (
          <Button
            variant="ghost"
            size="icon"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo"
            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {!isDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSetDefault}
            className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Set Default
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSaveAsNew}
          className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          Save As New
        </Button>

        <Button
          size="sm"
          disabled={submitting}
          onClick={onSave}
          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
