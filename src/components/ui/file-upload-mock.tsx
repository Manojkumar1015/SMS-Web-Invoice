'use client';

import * as React from 'react';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { Button } from './button';

interface FileUploadMockProps {
  label?: string;
  accept?: string;
  value?: { name: string; size: string; url?: string } | null;
  onChange: (file: { name: string; size: string; url?: string } | null) => void;
}

export function FileUploadMock({ label = 'Attachment / Receipt Voucher', accept = 'image/*,application/pdf', value, onChange }: FileUploadMockProps) {
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      // Simulate frontend upload progress delay
      setTimeout(() => {
        const sizeFormatted = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
        const mockUrl = URL.createObjectURL(file);
        onChange({ name: file.name, size: sizeFormatted, url: mockUrl });
        setUploading(false);
      }, 600);
    }
  };

  return (
    <div className="space-y-1.5 text-xs">
      <label className="font-bold text-slate-700 block">{label}</label>

      {value ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-800 truncate block">{value.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">{value.size} • Verified Mock Upload</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            className="h-7 w-7 text-slate-400 hover:text-red-600"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center">
          {uploading ? (
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs">
              <span className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
              <span>Simulating file upload...</span>
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 text-slate-400 mb-1" />
              <span className="font-semibold text-slate-700 text-xs">Click to upload document or image</span>
              <span className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG up to 10MB</span>
            </>
          )}
          <input type="file" accept={accept} onChange={handleFileChange} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
}
