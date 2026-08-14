'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customerService } from '@/services';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { CustomerAvatar } from '@/components/domain/customer/customer-avatar';
import { CustomerFormDialog } from '@/components/domain/customer/customer-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserPlus, Eye, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // Form & Confirm state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = React.useState<Customer | null>(null);

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({
        search,
        status: statusFilter,
        page,
        pageSize: 50,
      });
      setCustomers(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      const res = await customerService.deleteCustomer(deletingCustomer.id);
      toast({
        title: res.mode === 'deleted' ? 'Customer Deleted' : 'Customer Archived',
        description: res.message || (res.mode === 'deleted' ? 'Customer deleted successfully.' : 'Customer archived because financial records are associated with this customer.'),
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete customer',
        variant: 'destructive',
      });
    } finally {
      setDeletingCustomer(null);
      fetchCustomers();
    }
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      cell: (cust) => (
        <div className="flex items-center space-x-3">
          <CustomerAvatar name={cust.displayName} size="sm" />
          <div>
            <Link href={`/app/customers/${cust.id}`} className="font-semibold text-accent hover:underline block">
              {cust.displayName}
            </Link>
            {cust.companyName && (
              <span className="text-[11px] text-muted-foreground block">{cust.companyName}</span>
            )}
          </div>
        </div>
      ),
    },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    {
      header: 'GSTIN',
      cell: (cust) => (
        <span className="font-mono text-xs text-slate-600">{cust.gstin || '-'}</span>
      ),
    },
    {
      header: 'Total Invoiced',
      cell: (cust) => <CurrencyDisplay amount={cust.totalInvoiced} className="font-bold text-foreground" />,
    },
    {
      header: 'Paid',
      cell: (cust) => <CurrencyDisplay amount={cust.paid} className="font-bold text-emerald-600" />,
    },
    {
      header: 'Outstanding',
      cell: (cust) => (
        <CurrencyDisplay
          amount={cust.outstanding}
          className={`font-bold ${cust.outstanding > 0 ? 'text-red-600' : 'text-slate-500'}`}
        />
      ),
    },
    { header: 'Status', cell: (cust) => <StatusBadge status={cust.status} /> },
    {
      header: 'Actions',
      cell: (cust) => (
        <div className="flex items-center space-x-1">
          <Link href={`/app/customers/${cust.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Eye className="h-3.5 w-3.5 text-slate-600" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingCustomer(cust);
              setFormOpen(true);
            }}
          >
            <Edit className="h-3.5 w-3.5 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            onClick={() => setDeletingCustomer(cust)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage client accounts, billing addresses, and GST numbers."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingCustomer(null);
              setFormOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            New Customer
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search customers by name, GSTIN..." />
        <FilterBar
          options={[
            { value: 'active', label: 'Active Customers', count: statusFilter === 'active' ? totalItems : undefined },
            { value: 'inactive', label: 'Inactive / Archived', count: statusFilter === 'inactive' ? totalItems : undefined },
            { value: 'all', label: 'All Customers', count: statusFilter === 'all' ? totalItems : undefined },
          ]}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        keyExtractor={(c) => c.id}
        isLoading={loading}
        emptyMessage="No customers found. Click 'New Customer' to create your first client record."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={50}
        onPageChange={setPage}
      />

      {/* Add / Edit Form Drawer */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customerToEdit={editingCustomer}
        onSuccess={() => fetchCustomers()}
      />

      {/* Confirm Delete */}
      {deletingCustomer && (
        <ConfirmDialog
          open={!!deletingCustomer}
          onOpenChange={(open) => !open && setDeletingCustomer(null)}
          title="Delete Customer Profile?"
          description={`Are you sure you want to remove ${deletingCustomer.displayName}? This action cannot be undone.`}
          confirmLabel="Delete Customer"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
