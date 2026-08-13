'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  reportService,
  invoiceService,
  paymentService,
  expenseService,
  customerService,
} from '@/services';
import { DashboardMetrics, RevenueChartPoint, DateRangePeriod } from '@/types/report';
import { Invoice } from '@/types/invoice';
import { Payment } from '@/types/payment';
import { Expense } from '@/types/expense';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { CustomerAvatar } from '@/components/domain/customer/customer-avatar';
import { RecordPaymentDialog } from '@/components/domain/invoice/record-payment-dialog';
import { ExpenseFormDialog } from '@/components/domain/expense/expense-form-dialog';
import {
  Plus,
  Receipt,
  FilePlus,
  TrendingUp,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
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
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = React.useState<string>('');
  const [period, setPeriod] = React.useState<DateRangePeriod>('this_month');
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = React.useState<RevenueChartPoint[]>([]);
  const [recentInvoices, setRecentInvoices] = React.useState<Invoice[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = React.useState<Invoice[]>([]);
  const [recentPayments, setRecentPayments] = React.useState<Payment[]>([]);
  const [recentExpenses, setRecentExpenses] = React.useState<Expense[]>([]);
  const [topCustomers, setTopCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog triggers
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = React.useState<Invoice | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/v1/profile', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const name = json.data.fullName || json.data.email?.split('@')[0] || '';
          const firstName = name ? name.split(' ')[0] : '';
          setUserName(firstName);
        }
      })
      .catch(() => null);
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [m, cData, inv, outInv, pay, exp, topC] = await Promise.all([
        reportService.getDashboardMetrics(period),
        reportService.getRevenueChartData(period),
        invoiceService.getRecentInvoices(5),
        invoiceService.getOutstandingInvoices(),
        paymentService.getRecentPayments(5),
        expenseService.getRecentExpenses(5),
        customerService.getTopCustomers(5),
      ]);
      setMetrics(m);
      setChartData(cData);
      setRecentInvoices(inv);
      setOutstandingInvoices(outInv);
      setRecentPayments(pay);
      setRecentExpenses(exp);
      setTopCustomers(topC);
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const periods: { value: DateRangePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ];

  // Table Columns Setup
  const invoiceColumns: Column<Invoice>[] = [
    {
      header: 'Invoice',
      cell: (inv) => (
        <Link href={`/app/invoices/${inv.id}`} className="font-semibold text-accent hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Date', cell: (inv) => <DateDisplay date={inv.date} /> },
    { header: 'Due Date', cell: (inv) => <DateDisplay date={inv.dueDate} /> },
    {
      header: 'Amount',
      cell: (inv) => <CurrencyDisplay amount={inv.total} className="font-bold text-foreground" />,
    },
    { header: 'Status', cell: (inv) => <StatusBadge status={inv.status} /> },
    {
      header: 'Action',
      cell: (inv) => (
        <div className="flex items-center space-x-2">
          {inv.amountDue > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => setSelectedInvoiceForPayment(inv)}
            >
              Pay
            </Button>
          )}
          <Link href={`/app/invoices/${inv.id}`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    { header: 'Payment #', accessorKey: 'paymentNumber' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Invoice', accessorKey: 'invoiceNumber' },
    { header: 'Date', cell: (p) => <DateDisplay date={p.date} /> },
    {
      header: 'Method',
      cell: (p) => (
        <span className="capitalize text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {p.paymentMethod.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Amount',
      cell: (p) => <CurrencyDisplay amount={p.amount} className="font-bold text-emerald-600" />,
    },
  ];

  const hasChartData = chartData.some((d) => (d.revenue || 0) > 0 || (d.expenses || 0) > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={userName ? `Good morning, ${userName} 👋` : 'Good morning 👋'}
        subtitle="Here is your commercial billing and financial performance overview."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => router.push('/app/invoices/new')}>
              <Receipt className="h-4 w-4 mr-1.5" />
              New Invoice
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/app/quotes/new')}>
              <FilePlus className="h-4 w-4 mr-1.5" />
              New Quote
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5 text-red-600" />
              Add Expense
            </Button>
          </div>
        }
      />

      {/* Date Range Filter Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Timeframe Filter:
        </span>
        <div className="flex items-center space-x-1 overflow-x-auto">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                period === p.value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Revenue"
          amount={metrics?.totalRevenue || 0}
          change={metrics?.revenueChange}
          subtext="Total invoiced income"
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
        />
        <MetricCard
          label="Outstanding"
          amount={metrics?.outstanding || 0}
          change={metrics?.outstandingChange}
          subtext="Pending unpaid invoices"
          icon={<Receipt className="h-4 w-4 text-amber-600" />}
        />
        <MetricCard
          label="Payments Received"
          amount={metrics?.paymentsReceived || 0}
          change={metrics?.paymentsChange}
          subtext="Cleared bank & card payments"
          icon={<CreditCard className="h-4 w-4 text-blue-600" />}
        />
        <MetricCard
          label="Expenses"
          amount={metrics?.expenses || 0}
          change={metrics?.expensesChange}
          subtext="Operational vendor costs"
          icon={<DollarSign className="h-4 w-4 text-red-600" />}
        />
        <MetricCard
          label="Net Profit"
          amount={metrics?.netProfit || 0}
          change={metrics?.netProfitChange}
          subtext="Revenue minus expenses"
          icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Revenue & Cash Flow Overview</CardTitle>
              <CardDescription>Monthly revenue vs operational expenditure trend</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-4 flex items-center justify-center">
              {!hasChartData && !loading ? (
                <div className="text-center p-6 space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No financial data recorded yet</p>
                  <p className="text-[11px] text-slate-500">Create your first invoice or payment to see performance trends here.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Comparison ratio per period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-4 flex items-center justify-center">
              {!hasChartData && !loading ? (
                <div className="text-center p-6 space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No comparison data yet</p>
                  <p className="text-[11px] text-slate-500">Record invoices and expenses to view period breakdown.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest generated customer invoices</CardDescription>
            </div>
            <Link href="/app/invoices">
              <Button variant="ghost" size="sm" className="text-xs text-accent">
                View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={invoiceColumns}
              data={recentInvoices}
              keyExtractor={(inv) => inv.id}
              isLoading={loading}
              emptyMessage="No invoices generated yet."
            />
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Payments Received</CardTitle>
              <CardDescription>Cleared customer payments log</CardDescription>
            </div>
            <Link href="/app/payments">
              <Button variant="ghost" size="sm" className="text-xs text-accent">
                View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={paymentColumns}
              data={recentPayments}
              keyExtractor={(p) => p.id}
              isLoading={loading}
              emptyMessage="No payments recorded yet."
            />
          </CardContent>
        </Card>
      </div>

      {/* Grid: Outstanding Invoices, Expenses, Top Customers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Outstanding Invoices List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Requires collection follow-up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {outstandingInvoices.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No outstanding invoices requiring follow-up.</p>
            ) : (
              outstandingInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover/60 border border-border text-xs">
                  <div>
                    <Link href={`/app/invoices/${inv.id}`} className="font-bold text-foreground hover:text-accent">
                      {inv.invoiceNumber}
                    </Link>
                    <p className="text-muted-foreground text-[11px] truncate max-w-[140px]">{inv.customerName}</p>
                    <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Due: {inv.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={inv.amountDue} className="font-bold text-red-600 block" />
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Vendor expenditures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No expense records logged yet.</p>
            ) : (
              recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover/60 border border-border text-xs">
                  <div>
                    <h4 className="font-semibold text-foreground">{exp.vendorName}</h4>
                    <span className="text-[10px] text-muted-foreground">{exp.category}</span>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={exp.amount} className="font-bold text-foreground block" />
                    <span className="text-[10px] text-slate-400">{exp.date}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Customers List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Top Revenue Customers</CardTitle>
            <CardDescription>Highest value accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCustomers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No customer accounts logged yet.</p>
            ) : (
              topCustomers.map((cust) => (
                <div key={cust.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border text-xs">
                  <div className="flex items-center space-x-2.5 truncate">
                    <CustomerAvatar name={cust.displayName} size="sm" />
                    <div className="truncate">
                      <Link href={`/app/customers/${cust.id}`} className="font-semibold text-foreground hover:text-accent truncate block">
                        {cust.displayName}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">Invoiced: {formatCurrency(cust.totalInvoiced)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-600 font-semibold block">Paid: {formatCurrency(cust.paid)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      {selectedInvoiceForPayment && (
        <RecordPaymentDialog
          open={!!selectedInvoiceForPayment}
          onOpenChange={(open) => !open && setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Add Expense Dialog */}
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
