'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { expenseService } from '@/services';
import { Expense } from '@/types/expense';
import { ExpenseSummaryMetrics } from '@/services/interfaces/ExpenseService';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { ExpenseStatusBadge } from '@/components/domain/expense/expense-status-badge';
import { ExpenseCategoryBadge } from '@/components/domain/expense/expense-category-badge';
import { ConvertExpenseDialog } from '@/components/domain/expense/convert-expense-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Tag, Calendar, Clock, DollarSign, FilePlus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [metrics, setMetrics] = React.useState<ExpenseSummaryMetrics | null>(null);
  const [search, setSearch] = React.useState('');
  const [tabFilter, setTabFilter] = React.useState('all'); // all, customer, business, billable
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [convertExpense, setConvertExpense] = React.useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = React.useState<string | null>(null);

  const fetchExpenses = React.useCallback(async () => {
    setLoading(true);
    try {
      let expenseTypeParam: string | undefined = undefined;
      let billableParam: boolean | undefined = undefined;

      if (tabFilter === 'customer') expenseTypeParam = 'customer';
      if (tabFilter === 'business') expenseTypeParam = 'business';
      if (tabFilter === 'billable') billableParam = true;

      const [res, summary] = await Promise.all([
        expenseService.getExpenses({
          search,
          category: categoryFilter,
          expenseType: expenseTypeParam,
          billable: billableParam,
        }),
        expenseService.getExpenseSummary(),
      ]);

      setExpenses(res.data);
      setMetrics(summary);
    } finally {
      setLoading(false);
    }
  }, [search, tabFilter, categoryFilter]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async () => {
    if (!deletingExpenseId) return;
    try {
      await expenseService.deleteExpense(deletingExpenseId);
      toast({ title: 'Expense Deleted', description: 'Expense record removed.', variant: 'info' });
      setDeletingExpenseId(null);
      fetchExpenses();
    } catch {
      toast({ title: 'Error', description: 'Could not delete expense.', variant: 'destructive' });
      setDeletingExpenseId(null);
    }
  };

  const columns: Column<Expense>[] = [
    {
      header: 'Expense #',
      cell: (exp) => (
        <Link href={`/app/expenses/${exp.id}`} className="font-semibold font-mono text-indigo-600 hover:underline">
          {exp.expenseNumber}
        </Link>
      ),
    },
    {
      header: 'Category',
      cell: (exp) => <ExpenseCategoryBadge category={exp.category} />,
    },
    { header: 'Vendor / Payee', accessorKey: 'vendorName' },
    {
      header: 'Customer',
      cell: (exp) => <span className="text-xs text-slate-700 font-medium">{exp.customerName || '-'}</span>,
    },
    { header: 'Date', cell: (exp) => <DateDisplay date={exp.date} /> },
    {
      header: 'Type',
      cell: (exp) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
            exp.expenseType === 'customer'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {exp.expenseType}
        </span>
      ),
    },
    {
      header: 'Billable',
      cell: (exp) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            exp.billable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {exp.billable ? 'Billable' : 'Non-billable'}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      cell: (exp) => <CurrencyDisplay amount={exp.totalAmount} className="font-black text-slate-900 text-sm font-mono" />,
    },
    {
      header: 'Status',
      cell: (exp) => <ExpenseStatusBadge status={exp.status} />,
    },
    {
      header: 'Actions',
      cell: (exp) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/app/expenses/${exp.id}`)}>
              <Eye className="h-4 w-4 mr-2 text-slate-600" /> View Expense
            </DropdownMenuItem>
            {exp.billable && exp.status !== 'added_to_invoice' && (
              <DropdownMenuItem onClick={() => setConvertExpense(exp)}>
                <FilePlus className="h-4 w-4 mr-2 text-indigo-600" /> Add to Invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeletingExpenseId(exp.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Track business operational expenses and billable customer costs."
        actions={
          <Button size="sm" onClick={() => router.push('/app/expenses/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            + Add Expense
          </Button>
        }
      />

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
            <CurrencyDisplay amount={metrics?.totalExpenses || 0} className="text-lg font-extrabold text-slate-900 font-mono block" />
            <span className="text-[11px] text-slate-500">Lifetime total</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">This Month</span>
            <CurrencyDisplay amount={metrics?.thisMonth || 0} className="text-lg font-extrabold text-slate-900 font-mono block" />
            <span className="text-[11px] text-slate-500">{new Date().toLocaleString('en-US', { month: 'long' })} expenses</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Customer Expenses</span>
            <CurrencyDisplay amount={metrics?.customerExpenses || 0} className="text-lg font-extrabold text-purple-600 font-mono block" />
            <span className="text-[11px] text-slate-500">Client-related costs</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Expenses</span>
            <CurrencyDisplay amount={metrics?.businessExpenses || 0} className="text-lg font-extrabold text-slate-900 font-mono block" />
            <span className="text-[11px] text-slate-500">Operational overheads</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Billable Expenses</span>
            <CurrencyDisplay amount={metrics?.billableExpenses || 0} className="text-lg font-extrabold text-emerald-600 font-mono block" />
            <span className="text-[11px] text-slate-500">Invoiceable to clients</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <FilterBar
          options={[
            { value: 'all', label: 'All Expenses' },
            { value: 'customer', label: 'Customer Expenses' },
            { value: 'business', label: 'Business Expenses' },
            { value: 'billable', label: 'Billable' },
          ]}
          activeFilter={tabFilter}
          onFilterChange={setTabFilter}
        />

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <SearchInput value={search} onSearchChange={setSearch} placeholder="Search expenses by vendor, category..." />

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(e) => e.id}
        isLoading={loading}
        emptyMessage="No expense records found."
      />

      {/* Convert to Invoice Dialog */}
      <ConvertExpenseDialog
        open={!!convertExpense}
        onOpenChange={(open) => !open && setConvertExpense(null)}
        expense={convertExpense}
        onSuccess={() => fetchExpenses()}
      />

      {/* Delete Confirmation */}
      {deletingExpenseId && (
        <ConfirmDialog
          open={!!deletingExpenseId}
          onOpenChange={(open) => !open && setDeletingExpenseId(null)}
          title="Delete Expense Record?"
          description="Are you sure you want to delete this expense entry? This action cannot be undone."
          confirmLabel="Delete Expense"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
