'use client';

import * as React from 'react';
import { TemplateConfiguration, TableColumnConfig } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Upload, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff, Palette, Type, Layout, LayoutGrid, Users, FileText, Table, Percent, Calculator, CreditCard, PenTool, CheckCircle, FileCode, Stamp, Droplets } from 'lucide-react';

interface TemplateCustomizerPanelProps {
  config: TemplateConfiguration;
  onChange: (updated: TemplateConfiguration) => void;
}

const colorPresets = [
  { name: 'Modern Indigo', primary: '#4f46e5', secondary: '#6366f1', tableHeaderBg: '#EEF2FF' },
  { name: 'Corporate Navy', primary: '#0f172a', secondary: '#1e293b', tableHeaderBg: '#f1f5f9' },
  { name: 'Professional Slate', primary: '#334155', secondary: '#475569', tableHeaderBg: '#f1f5f9' },
  { name: 'Emerald Green', primary: '#059669', secondary: '#10b981', tableHeaderBg: '#ECFDF5' },
  { name: 'Warm Orange', primary: '#ea580c', secondary: '#f97316', tableHeaderBg: '#FFF7ED' },
  { name: 'Elegant Burgundy', primary: '#881337', secondary: '#9f1239', tableHeaderBg: '#FFF1F2' },
  { name: 'Classic Blue', primary: '#2563eb', secondary: '#3b82f6', tableHeaderBg: '#EFF6FF' },
];

export function TemplateCustomizerPanel({ config, onChange }: TemplateCustomizerPanelProps) {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    branding: true,
    typography: false,
    header: false,
    customer: false,
    items: false,
    tax: false,
    totals: false,
    payment: false,
    signature: false,
    watermark: false,
    sections: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePartial = (path: keyof TemplateConfiguration, val: any) => {
    const currentVal = config[path];
    const updatedVal = typeof val === 'object' && val !== null && !Array.isArray(val) && typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal)
      ? { ...currentVal, ...val }
      : val;

    onChange({
      ...config,
      [path]: updatedVal,
    });
  };

  // Mock Logo File Upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mockUrl = URL.createObjectURL(file);
      updatePartial('branding', { logoUrl: mockUrl });
    }
  };

  // Column toggle handler
  const toggleColumnVisibility = (colKey: string) => {
    const cols = config.itemsTable.columns.map((col) =>
      col.key === colKey ? { ...col, visible: !col.visible } : col
    );
    updatePartial('itemsTable', { columns: cols });
  };

  // Section reorder handler
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...config.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

    sections.forEach((sec, idx) => {
      sec.order = idx + 1;
    });

    updatePartial('sections', sections);
  };

  return (
    <div className="w-full lg:w-96 bg-white border-r border-slate-200 h-full overflow-y-auto p-4 space-y-3 text-xs">
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Palette className="h-4 w-4 text-indigo-600" /> Visual Customizer
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">Customize fonts, branding, colors & table layouts.</p>
      </div>

      {/* 1. BRANDING & COLORS */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('branding')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-600" /> Branding & Theme Colors
          </span>
          {openSections.branding ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.branding && (
          <div className="p-3 space-y-4 bg-white border-t border-slate-200">
            {/* Logo Upload Placeholder */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Company Logo</label>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 shrink-0 relative overflow-hidden">
                  {config.branding.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={config.branding.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="cursor-pointer inline-flex items-center px-2.5 py-1.5 rounded border border-slate-300 bg-white font-semibold text-[11px] text-slate-700 hover:bg-slate-50">
                    <Upload className="h-3 w-3 mr-1 text-slate-500" /> Upload Logo Image
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {config.branding.logoUrl && (
                    <button
                      onClick={() => updatePartial('branding', { logoUrl: undefined })}
                      className="text-[10px] text-red-600 hover:underline block"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Logo Size</label>
                <Select
                  value={config.branding.logoSize}
                  onValueChange={(val) => updatePartial('branding', { logoSize: val })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Logo Alignment</label>
                <Select
                  value={config.branding.logoAlignment}
                  onValueChange={(val) => updatePartial('branding', { logoAlignment: val })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Preset Color Themes</label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() =>
                      updatePartial('colors', {
                        primary: preset.primary,
                        secondary: preset.secondary,
                        tableHeaderBg: preset.tableHeaderBg,
                      })
                    }
                    className="flex items-center space-x-2 p-1.5 rounded border border-slate-200 hover:border-indigo-400 text-left bg-slate-50"
                  >
                    <div className="h-4 w-4 rounded-full shrink-0 border" style={{ backgroundColor: preset.primary }} />
                    <span className="text-[11px] font-medium text-slate-700 truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-700 block">Custom Colors</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Primary Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={config.colors.primary}
                      onChange={(e) => updatePartial('colors', { primary: e.target.value })}
                      className="h-7 w-9 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.colors.primary}
                      onChange={(e) => updatePartial('colors', { primary: e.target.value })}
                      className="h-7 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Header Background</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={config.colors.tableHeaderBg}
                      onChange={(e) => updatePartial('colors', { tableHeaderBg: e.target.value })}
                      className="h-7 w-9 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.colors.tableHeaderBg}
                      onChange={(e) => updatePartial('colors', { tableHeaderBg: e.target.value })}
                      className="h-7 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. TYPOGRAPHY */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('typography')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Type className="h-4 w-4 text-indigo-600" /> Typography & Fonts
          </span>
          {openSections.typography ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.typography && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Font Family</label>
              <Select
                value={config.typography.fontFamily}
                onValueChange={(val) => updatePartial('typography', { fontFamily: val })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Modern Sans)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Clean Corporate)</SelectItem>
                  <SelectItem value="Outfit">Outfit (Creative Display)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Elegant Serif)</SelectItem>
                  <SelectItem value="Lora">Lora (Classic Editorial Serif)</SelectItem>
                  <SelectItem value="Courier Prime">Courier Prime (Monospace)</SelectItem>
                  <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans (Minimal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Heading Size (px)</label>
                <Input
                  type="number"
                  value={config.typography.headingSize}
                  onChange={(e) => updatePartial('typography', { headingSize: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Body Size (px)</label>
                <Input
                  type="number"
                  value={config.typography.bodySize}
                  onChange={(e) => updatePartial('typography', { bodySize: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. HEADER LAYOUT */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('header')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-indigo-600" /> Header Layout Style
          </span>
          {openSections.header ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.header && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Header Design</label>
              <Select
                value={config.header.style}
                onValueChange={(val) => updatePartial('header', { style: val })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (Logo Left, Title Right)</SelectItem>
                  <SelectItem value="modern">Modern (Indigo Pill Header)</SelectItem>
                  <SelectItem value="centered">Centered (Formal Corporate)</SelectItem>
                  <SelectItem value="split">Split Double Divider</SelectItem>
                  <SelectItem value="minimal">Minimalist Lightweight</SelectItem>
                  <SelectItem value="banner">Full Primary Color Banner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* 4. CUSTOMER & DETAILS */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('customer')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> Customer & Invoice Info
          </span>
          {openSections.customer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.customer && (
          <div className="p-3 space-y-2 bg-white border-t border-slate-200 text-xs">
            <label className="text-xs font-bold text-slate-700 block mb-1">Customer Fields Visibility</label>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.customer.showGstin}
                  onChange={(e) => updatePartial('customer', { showGstin: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Include Customer GSTIN</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.customer.showPhone}
                  onChange={(e) => updatePartial('customer', { showPhone: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Include Phone Number</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.customer.showShippingAddress}
                  onChange={(e) => updatePartial('customer', { showShippingAddress: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Include Shipping Address</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 5. ITEM TABLE COLUMNS */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('items')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Table className="h-4 w-4 text-indigo-600" /> Item Table Columns
          </span>
          {openSections.items ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.items && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1">Configure Columns</label>
            <div className="space-y-1.5 border rounded-lg p-2 bg-slate-50 divide-y divide-slate-200">
              {config.itemsTable.columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between py-1 text-xs">
                  <span className="font-medium text-slate-700">{col.label}</span>
                  <button
                    onClick={() => toggleColumnVisibility(col.key)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      col.visible ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {col.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{col.visible ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.itemsTable.stripedRows}
                  onChange={(e) => updatePartial('itemsTable', { stripedRows: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Alternating Striped Rows</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 6. TAX DISPLAY & GST */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('tax')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-indigo-600" /> GST Tax Breakdown
          </span>
          {openSections.tax ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.tax && (
          <div className="p-3 space-y-2 bg-white border-t border-slate-200 text-xs">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.taxes.showTaxSummary}
                onChange={(e) => updatePartial('taxes', { showTaxSummary: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Include GST Tax Breakdown Box</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.taxes.breakdownGst}
                onChange={(e) => updatePartial('taxes', { breakdownGst: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Split CGST + SGST (Intrastate)</span>
            </label>
          </div>
        )}
      </div>

      {/* 7. PAYMENT & BANK INFO */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('payment')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" /> Payment & UPI Info
          </span>
          {openSections.payment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.payment && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.payment.showBankDetails}
                onChange={(e) => updatePartial('payment', { showBankDetails: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="font-bold text-slate-700">Display Bank Account Info</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.payment.showUpiQr}
                onChange={(e) => updatePartial('payment', { showUpiQr: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Display UPI QR Code Placeholder</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">UPI ID</label>
              <Input
                value={config.payment.upiId}
                onChange={(e) => updatePartial('payment', { upiId: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 8. DIGITAL SIGNATURE & STAMP */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('signature')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Stamp className="h-4 w-4 text-indigo-600" /> Digital Signature & Stamp
          </span>
          {openSections.signature ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.signature && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.signature.visible}
                onChange={(e) => updatePartial('signature', { visible: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="font-bold text-slate-700">Display Authorized Signature Block</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Authorized Person Name</label>
              <Input
                value={config.signature.authorizedPerson}
                onChange={(e) => updatePartial('signature', { authorizedPerson: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 9. WATERMARK OVERLAY */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('watermark')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-indigo-600" /> Watermark Overlay
          </span>
          {openSections.watermark ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.watermark && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.watermark.enabled}
                onChange={(e) => updatePartial('watermark', { enabled: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span className="font-bold text-slate-700">Enable Watermark Overlay</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Watermark Text</label>
              <Select
                value={config.watermark.text}
                onValueChange={(val) => updatePartial('watermark', { text: val })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="ORIGINAL">ORIGINAL</SelectItem>
                  <SelectItem value="COPY">DUPLICATE COPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* 10. SECTION REORDERING */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          onClick={() => toggleSection('sections')}
          className="w-full p-3 font-bold text-slate-900 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100"
        >
          <span className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-indigo-600" /> Reorder Document Sections
          </span>
          {openSections.sections ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.sections && (
          <div className="p-3 space-y-2 bg-white border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1">Section Order</label>
            <div className="space-y-1 border rounded-lg p-2 bg-slate-50 divide-y divide-slate-200">
              {config.sections.map((sec, idx) => (
                <div key={sec.id} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-medium text-slate-800">{sec.name}</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="h-6 w-6 text-slate-500"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === config.sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="h-6 w-6 text-slate-500"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
