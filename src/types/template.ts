export type TemplateCategory =
  | 'classic'
  | 'modern'
  | 'minimal'
  | 'professional'
  | 'corporate'
  | 'creative'
  | 'elegant'
  | 'gst_standard';

export interface BrandingConfig {
  logoUrl?: string;
  logoVisible: boolean;
  logoSize: 'small' | 'medium' | 'large';
  logoAlignment: 'left' | 'center' | 'right';
  showCompanyName: boolean;
  showCompanyDetails: boolean;
  companyName?: string;
  companyGstin?: string;
  companyPan?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  border: string;
}

export interface TypographyConfig {
  fontFamily: 'Inter' | 'Roboto' | 'Outfit' | 'Playfair Display' | 'Courier Prime' | 'Lora' | 'Plus Jakarta Sans';
  headingSize: number; // in px
  bodySize: number; // in px
  tableSize: number; // in px
  headingWeight: 'normal' | 'semibold' | 'bold' | 'extrabold';
  bodyWeight: 'normal' | 'medium';
}

export interface LayoutConfig {
  pageSize: 'A4';
  orientation: 'portrait';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sectionSpacing: number;
  tableSpacing: number;
}

export interface HeaderConfig {
  style: 'classic' | 'centered' | 'split' | 'modern' | 'minimal' | 'banner';
  logoPosition: 'left' | 'center' | 'right';
  companyPos: 'left' | 'center' | 'right';
  docTitlePos: 'left' | 'right';
  showBannerBg: boolean;
}

export interface CustomerSectionConfig {
  showName: boolean;
  showCompany: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showBillingAddress: boolean;
  showShippingAddress: boolean;
  showGstin: boolean;
  showPan: boolean;
  layout: 'grid' | 'stacked' | 'side_by_side';
}

export interface InvoiceDetailsConfig {
  showInvoiceNumber: boolean;
  showDate: boolean;
  showDueDate: boolean;
  showPaymentTerms: boolean;
  showRefNumber: boolean;
}

export interface TableColumnConfig {
  key: 'index' | 'item' | 'description' | 'hsn' | 'quantity' | 'unit' | 'rate' | 'discount' | 'tax' | 'amount';
  label: string;
  visible: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface ItemsTableConfig {
  columns: TableColumnConfig[];
  showBorders: boolean;
  showRowBorders: boolean;
  headerBg: boolean;
  stripedRows: boolean;
  compactRows: boolean;
}

export interface TaxConfig {
  showTaxColumn: boolean;
  showTaxSummary: boolean;
  breakdownGst: boolean;
  showCgstSgstIgst: boolean;
}

export interface TotalsConfig {
  showSubtotal: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showRoundOff: boolean;
  showGrandTotal: boolean;
  grandTotalEmphasis: boolean;
  alignment: 'left' | 'right';
}

export interface PaymentConfig {
  showBankDetails: boolean;
  showUpiQr: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
  instructions: string;
}

export interface NoteConfig {
  visible: boolean;
  heading: string;
  text: string;
}

export interface TermsConfig {
  visible: boolean;
  heading: string;
  text: string;
}

export interface SignatureConfig {
  visible: boolean;
  label: string;
  authorizedPerson: string;
  designation: string;
  signatureUrl?: string;
  showDigitalStamp: boolean;
}

export interface FooterConfig {
  visible: boolean;
  text: string;
  showPageNumbers: boolean;
  alignment: 'left' | 'center' | 'right';
}

export interface WatermarkConfig {
  enabled: boolean;
  text: 'PAID' | 'DRAFT' | 'ORIGINAL' | 'COPY' | string;
  opacity: number;
  rotation: number;
  color: string;
}

export interface SectionOrderConfig {
  id: 'header' | 'customer' | 'details' | 'items' | 'taxes' | 'totals' | 'payment' | 'notes' | 'terms' | 'signature' | 'footer';
  name: string;
  enabled: boolean;
  order: number;
}

export interface TemplateConfiguration {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isSystem: boolean;
  isDefault: boolean;
  updatedAt: string;

  branding: BrandingConfig;
  colors: ColorConfig;
  typography: TypographyConfig;
  layout: LayoutConfig;
  header: HeaderConfig;
  customer: CustomerSectionConfig;
  invoiceDetails: InvoiceDetailsConfig;
  itemsTable: ItemsTableConfig;
  taxes: TaxConfig;
  totals: TotalsConfig;
  payment: PaymentConfig;
  notes: NoteConfig;
  terms: TermsConfig;
  signature: SignatureConfig;
  footer: FooterConfig;
  watermark: WatermarkConfig;
  sections: SectionOrderConfig[];
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isSystem: boolean;
  isDefault: boolean;
  updatedAt: string;
  config: TemplateConfiguration;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  category?: TemplateCategory;
  isSystem?: boolean;
  isDefault?: boolean;
  config?: Partial<TemplateConfiguration> | Record<string, any>;
}
