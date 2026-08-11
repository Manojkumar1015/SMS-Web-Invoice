'use client';

import * as React from 'react';
import { expenseService } from '@/services';
import { Expense } from '@/types/expense';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { ExpenseFormDialog } from '@/components/domain/expense/expense-form-dialog';
import { Plus } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);

  const fetchExpenses = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseService.getExpenses({
        search,
        category: categoryFilter,
      });
      setExpenses(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const columns: Column<Expense>[] = [
    {
      header: 'Expense #',
      cell: (exp) => <span className="font-semibold font-mono text-accent">{exp.expenseNumber}</span>,
    },
    { header: 'Vendor / Payee', accessorKey: 'vendorName' },
    {
      header: 'Category',
      cell: (exp) => (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {exp.category}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (exp) => <span className="text-xs">{exp.customerName || '-'}</span>,
    },
    { header: 'Date', cell: (exp) => <DateDisplay date={exp.date} /> },
    {
      header: 'Type',
      cell: (exp) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            exp.type === 'Billable' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {exp.type}
        </span>
      ),
    },
    {
      header: 'Amount',
      cell: (exp) => <CurrencyDisplay amount={exp.amount} className="font-bold text-foreground" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses Tracker"
        subtitle="Log operational overheads, hosting costs, and billable vendor purchases."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Expense
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search expenses by vendor, category..." />
        <FilterBar
          options={[
            { value: 'all', label: 'All Categories', count: expenses.length },
            { value: 'Software & Subscriptions', label: 'Software' },
            { value: 'Office Supplies', label: 'Office Supplies' },
            { value: 'Travel & Lodging', label: 'Travel' },
          ]}
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(exp) => exp.id}
        isLoading={loading}
        emptyMessage="No business expenses logged."
      />

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => fetchExpenses()}
      />
    </div>
  );
}
