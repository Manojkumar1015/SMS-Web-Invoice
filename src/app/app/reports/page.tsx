'use client';

import * as React from 'react';
import { reportService } from '@/services';
import {
  DateRangePreset,
  DateFilter,
  DashboardMetrics,
  RevenueReportData,
  InvoiceReportData,
  PaymentReportData,
  ExpenseReportData,
  ProfitReportData,
  TaxReportData,
  TopCustomerMetric,
} from '@/types/report';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { PaymentMethodBadge } from '@/components/domain/payment/payment-method-badge';
import { ExpenseCategoryBadge } from '@/components/domain/expense/expense-category-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  CreditCard,
  DollarSign,
  Receipt,
  Users,
  Percent,
  Calendar,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

import { getDateRangeFromPreset } from '@/lib/dateRanges';

export default function ReportsPage() {
  const { toast } = useToast();

  // Date Filter state
  const initialRange = getDateRangeFromPreset('this_month');
  const [preset, setPreset] = React.useState<DateRangePreset>('this_month');
  const [startDate, setStartDate] = React.useState(initialRange.startDate);
  const [endDate, setEndDate] = React.useState(initialRange.endDate);
  const [aggregation, setAggregation] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');


  // Report datasets
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = React.useState<RevenueReportData | null>(null);
  const [invoiceData, setInvoiceData] = React.useState<InvoiceReportData | null>(null);
  const [paymentData, setPaymentData] = React.useState<PaymentReportData | null>(null);
  const [expenseData, setExpenseData] = React.useState<ExpenseReportData | null>(null);
  const [profitData, setProfitData] = React.useState<ProfitReportData | null>(null);
  const [customerData, setCustomerData] = React.useState<TopCustomerMetric[]>([]);
  const [taxData, setTaxData] = React.useState<TaxReportData | null>(null);

  const [loading, setLoading] = React.useState(true);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    const filter: DateFilter = { preset, startDate, endDate };
    try {
      const [m, rev, inv, pay, exp, prf, cust, tax] = await Promise.all([
        reportService.getDashboardMetrics(preset),
        reportService.getRevenueReport(filter),
        reportService.getInvoiceReport(filter),
        reportService.getPaymentReport(filter),
        reportService.getExpenseReport(filter),
        reportService.getProfitReport(filter),
        reportService.getCustomerReport(filter),
        reportService.getTaxReport(filter),
      ]);

      setMetrics(m);
      setRevenueData(rev);
      setInvoiceData(inv);
      setPaymentData(pay);
      setExpenseData(exp);
      setProfitData(prf);
      setCustomerData(cust);
      setTaxData(tax);
    } finally {
      setLoading(false);
    }
  }, [preset, startDate, endDate]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Chart Color Palette
  const PIE_COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626', '#8b5cf6'];

  // Export CSV Handler
  const handleExportCSV = (reportName: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportName === 'revenue' && revenueData) {
      csvContent += 'Date,Revenue,Payments Received,Expenses,Net Profit\n';
      revenueData.chartData.forEach((row) => {
        csvContent += `"${row.date}",${row.revenue},${row.payments},${row.expenses},${row.netProfit}\n`;
      });
    } else if (reportName === 'tax' && taxData) {
      csvContent += 'Tax Slab,Taxable Turnover,CGST,SGST,IGST,Total GST\n';
      taxData.slabs.forEach((s) => {
        csvContent += `"${s.slabName}",${s.taxableTurnover},${s.cgst},${s.sgst},${s.igst},${s.totalGst}\n`;
      });
    } else {
      csvContent += 'Report,Value\n';
      csvContent += `Total Revenue,${metrics?.totalRevenue || 0}\n`;
      csvContent += `Payments Received,${metrics?.paymentsReceived || 0}\n`;
      csvContent += `Total Expenses,${metrics?.expenses || 0}\n`;
      csvContent += `Net Profit,${metrics?.netProfit || 0}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName}_report_${preset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'CSV Export Generated',
      description: `Downloaded ${reportName}_report_${preset}.csv`,
      variant: 'success',
    });
  };

  const handlePrint = () => {
    toast({ title: 'Print Report', description: 'Opening print preview...', variant: 'info' });
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Analyze revenue, invoices, payments, expenses and business performance."
        actions={
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => handleExportCSV('full_summary')}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Report
            </Button>
          </div>
        }
      />

      {/* Global Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Date Filter Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'last_week', label: 'Last Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_quarter', label: 'This Quarter' },
              { id: 'this_year', label: 'This Year' },
              { id: 'last_year', label: 'Last Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const pId = p.id as DateRangePreset;
                  setPreset(pId);
                  if (pId !== 'custom') {
                    const range = getDateRangeFromPreset(pId);
                    setStartDate(range.startDate);
                    setEndDate(range.endDate);
                  }
                }}

                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  preset === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('custom');
              }}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('custom');
              }}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chart Aggregation</label>
            <Select value={aggregation} onValueChange={(v) => setAggregation(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <span className="text-[11px] text-slate-500 italic pb-1">
              Filter applied to all charts & metrics below.
            </span>
          </div>
        </div>
      </div>

      {/* 7 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <CurrencyDisplay amount={metrics?.totalRevenue || 0} className="text-base font-extrabold text-slate-900 font-mono block" />
            <span className="text-[10px] text-emerald-600 font-semibold">+{metrics?.revenueChange}% vs prev</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Payments Received</span>
            <CurrencyDisplay amount={metrics?.paymentsReceived || 0} className="text-base font-extrabold text-emerald-600 font-mono block" />
            <span className="text-[10px] text-slate-500">Cleared bank receipts</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Outstanding</span>
            <CurrencyDisplay amount={metrics?.outstanding || 0} className="text-base font-extrabold text-amber-600 font-mono block" />
            <span className="text-[10px] text-slate-500">Uncollected balance</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Total Expenses</span>
            <CurrencyDisplay amount={metrics?.expenses || 0} className="text-base font-extrabold text-red-600 font-mono block" />
            <span className="text-[10px] text-slate-500">Operational costs</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Net Profit</span>
            <CurrencyDisplay amount={metrics?.netProfit || 0} className="text-base font-extrabold text-indigo-600 font-mono block" />
            <span className="text-[10px] text-emerald-600 font-semibold">+{metrics?.netProfitChange}% margin</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoices</span>
            <span className="text-base font-extrabold text-slate-900 font-mono block">{metrics?.invoicesCount || 0}</span>
            <span className="text-[10px] text-slate-500">Issued documents</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
            <span className="text-base font-extrabold text-slate-900 font-mono block">{metrics?.customersCount || 0}</span>
            <span className="text-[10px] text-slate-500">Active accounts</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="revenue" className="w-full space-y-4">
        <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent p-0 flex-wrap">
          <TabsTrigger value="revenue">Revenue Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Report</TabsTrigger>
          <TabsTrigger value="payments">Payment Report</TabsTrigger>
          <TabsTrigger value="expenses">Expense Report</TabsTrigger>
          <TabsTrigger value="profit">Profit & Loss</TabsTrigger>
          <TabsTrigger value="customers">Customer Performance</TabsTrigger>
          <TabsTrigger value="taxes">Tax / GST Summary</TabsTrigger>
        </TabsList>

        {/* 1. REVENUE REPORT */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Revenue & Collection Trend</CardTitle>
                <CardDescription>Visual trend of total invoiced revenue vs payments received ({aggregation.toUpperCase()})</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportCSV('revenue')}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData?.chartData || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Invoiced Revenue" />
                    <Area type="monotone" dataKey="payments" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorPayments)" name="Payments Received" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. INVOICE REPORT */}
        <TabsContent value="invoices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Invoice Breakdown by Status</CardTitle>
                <CardDescription>Volume and monetary value across lifecycle stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Invoice Count</th>
                        <th className="px-4 py-3 text-right">Invoiced Amount</th>
                        <th className="px-4 py-3 text-right">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceData?.byStatus.map((row) => (
                        <tr key={row.status}>
                          <td className="px-4 py-3 font-semibold capitalize"><StatusBadge status={row.status} /></td>
                          <td className="px-4 py-3 text-center font-mono font-bold">{row.count}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold"><CurrencyDisplay amount={row.amount} /></td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-red-600"><CurrencyDisplay amount={row.outstanding} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Status Ratio</CardTitle>
                <CardDescription>Proportional count distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={invoiceData?.byStatus || []} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count">
                        {invoiceData?.byStatus.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. PAYMENT REPORT */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Payment Method Breakdown</CardTitle>
                <CardDescription>Collections categorized by Bank Transfer, UPI, Cash, Cheque, and Card</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Payment Method</th>
                        <th className="px-4 py-3 text-center">Receipts Count</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentData?.byMethod.map((row) => (
                        <tr key={row.method}>
                          <td className="px-4 py-3 font-semibold"><PaymentMethodBadge method={row.method} /></td>
                          <td className="px-4 py-3 text-center font-mono font-bold">{row.count}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600"><CurrencyDisplay amount={row.amount} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentData?.byMethod || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="method" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <RechartsTooltip formatter={(val: any) => [formatCurrency(Number(val)), '']} />
                      <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} name="Collected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. EXPENSE REPORT */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Expense Category Breakdown</CardTitle>
                <CardDescription>Departmental expenditure distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3 text-right">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenseData?.byCategory.map((cat) => (
                        <tr key={cat.category}>
                          <td className="px-4 py-3 font-semibold"><ExpenseCategoryBadge category={cat.category} /></td>
                          <td className="px-4 py-3 text-right font-mono font-bold"><CurrencyDisplay amount={cat.amount} /></td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-600">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Chart</CardTitle>
                <CardDescription>Expenses distribution pie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseData?.byCategory || []} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="amount">
                        {expenseData?.byCategory.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v: any) => [formatCurrency(Number(v)), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. PROFIT REPORT */}
        <TabsContent value="profit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <CardTitle>Profit & Loss Summary</CardTitle>
              </div>
              <CardDescription>Financial summary of total revenue, operating expenses, and net profit margin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800">
                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Frontend Formula Note:</strong> Net Profit = Invoiced Revenue - Recorded Expenses. This is a display-only preview calculation.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Revenue</span>
                  <CurrencyDisplay amount={profitData?.revenue || 0} className="text-xl font-black text-slate-900 font-mono block" />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Total Expenses</span>
                  <CurrencyDisplay amount={profitData?.expenses || 0} className="text-xl font-black text-red-600 font-mono block" />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Net Profit</span>
                  <CurrencyDisplay amount={profitData?.netProfit || 0} className="text-xl font-black text-indigo-600 font-mono block" />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Net Profit Margin</span>
                  <span className="text-xl font-black text-emerald-600 font-mono block">{profitData?.profitMarginPercentage || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. CUSTOMER REPORT */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Performance Table</CardTitle>
              <CardDescription>Revenue generation, payment clearance, and net profit contribution by customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Customer Account</th>
                      <th className="px-4 py-3 text-center">Invoices</th>
                      <th className="px-4 py-3 text-right">Invoiced Revenue</th>
                      <th className="px-4 py-3 text-right">Cleared Payments</th>
                      <th className="px-4 py-3 text-right">Outstanding</th>
                      <th className="px-4 py-3 text-right font-bold text-indigo-700">Profit Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {customerData.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{c.customerName}</td>
                        <td className="px-4 py-3 text-center font-semibold">{c.invoicesCount}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900"><CurrencyDisplay amount={c.revenue} /></td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600"><CurrencyDisplay amount={c.paid} /></td>
                        <td className="px-4 py-3 text-right font-bold text-red-600"><CurrencyDisplay amount={c.outstanding} /></td>
                        <td className="px-4 py-3 text-right font-black text-indigo-700"><CurrencyDisplay amount={c.profitContribution} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. TAX / GST SUMMARY */}
        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>GST Tax Liabilities & Output Summary</CardTitle>
                <CardDescription>Simulated GST tax liability breakdown across CGST (9%), SGST (9%), and IGST (18%)</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportCSV('tax')}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export GST CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 font-sans block text-[10px] uppercase">Total Taxable Turnover:</span>
                  <CurrencyDisplay amount={taxData?.taxableAmount || 0} className="text-lg font-bold text-slate-900" />
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[10px] uppercase">Total GST Liabilities:</span>
                  <CurrencyDisplay amount={taxData?.totalGst || 0} className="text-lg font-black text-emerald-600" />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Tax Slab</th>
                      <th className="px-4 py-3 text-right">Taxable Turnover</th>
                      <th className="px-4 py-3 text-right">CGST (9%)</th>
                      <th className="px-4 py-3 text-right">SGST (9%)</th>
                      <th className="px-4 py-3 text-right">IGST (18%)</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-900">Total GST Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {taxData?.slabs.map((slab) => (
                      <tr key={slab.slabName}>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{slab.slabName}</td>
                        <td className="px-4 py-3 text-right"><CurrencyDisplay amount={slab.taxableTurnover} /></td>
                        <td className="px-4 py-3 text-right"><CurrencyDisplay amount={slab.cgst} /></td>
                        <td className="px-4 py-3 text-right"><CurrencyDisplay amount={slab.sgst} /></td>
                        <td className="px-4 py-3 text-right"><CurrencyDisplay amount={slab.igst} /></td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600"><CurrencyDisplay amount={slab.totalGst} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
