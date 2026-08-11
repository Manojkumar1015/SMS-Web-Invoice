'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  customerService,
  invoiceService,
  paymentService,
  expenseService,
  quoteService,
} from '@/services';
import { Customer } from '@/types/customer';
import { Invoice } from '@/types/invoice';
import { Quote } from '@/types/quote';
import { Payment } from '@/types/payment';
import { Expense } from '@/types/expense';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomerAvatar } from '@/components/domain/customer/customer-avatar';
import { CustomerSummaryCard } from '@/components/domain/customer/customer-summary-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, Column } from '@/components/ui/data-table';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { CustomerFormDialog } from '@/components/domain/customer/customer-form-dialog';
import { RecordPaymentDialog } from '@/components/domain/invoice/record-payment-dialog';
import { ExpenseFormDialog } from '@/components/domain/expense/expense-form-dialog';
import { Receipt, FilePlus, CreditCard, Plus, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [editFormOpen, setEditFormOpen] = React.useState(false);
  const [paymentInvoice, setPaymentInvoice] = React.useState<Invoice | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = React.useState(false);

  const loadCustomerData = React.useCallback(async () => {
    setLoading(true);
    try {
      const cust = await customerService.getCustomerById(customerId);
      if (!cust) return;
      setCustomer(cust);

      const [invList, quoList, payList, expList] = await Promise.all([
        invoiceService.getInvoicesByCustomer(customerId),
        quoteService.getQuotes({ customerId }),
        paymentService.getPaymentsByCustomer(customerId),
        expenseService.getExpensesByCustomer(customerId),
      ]);

      setInvoices(invList);
      setQuotes(quoList.data);
      setPayments(payList);
      setExpenses(expList);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading Customer 360 view...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-sm font-semibold">Customer not found</h3>
        <Button variant="outline" size="sm" onClick={() => router.push('/app/customers')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
        </Button>
      </div>
    );
  }

  const invoiceColumns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => (
        <Link href={`/app/invoices/${inv.id}`} className="font-semibold text-accent hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    { header: 'Date', cell: (inv) => <DateDisplay date={inv.date} /> },
    { header: 'Due Date', cell: (inv) => <DateDisplay date={inv.dueDate} /> },
    { header: 'Total', cell: (inv) => <CurrencyDisplay amount={inv.total} className="font-bold" /> },
    { header: 'Due', cell: (inv) => <CurrencyDisplay amount={inv.amountDue} className="font-semibold text-red-600" /> },
    { header: 'Status', cell: (inv) => <StatusBadge status={inv.status} /> },
  ];

  const quoteColumns: Column<Quote>[] = [
    {
      header: 'Quote #',
      cell: (q) => (
        <Link href={`/app/quotes/${q.id}`} className="font-semibold text-accent hover:underline">
          {q.quoteNumber}
        </Link>
      ),
    },
    { header: 'Date', cell: (q) => <DateDisplay date={q.date} /> },
    { header: 'Expiry', cell: (q) => <DateDisplay date={q.expiryDate} /> },
    { header: 'Total', cell: (q) => <CurrencyDisplay amount={q.total} className="font-bold" /> },
    { header: 'Status', cell: (q) => <StatusBadge status={q.status} /> },
  ];

  const paymentColumns: Column<Payment>[] = [
    { header: 'Payment #', accessorKey: 'paymentNumber' },
    { header: 'Invoice #', accessorKey: 'invoiceNumber' },
    { header: 'Date', cell: (p) => <DateDisplay date={p.date} /> },
    { header: 'Method', accessorKey: 'paymentMethod' },
    { header: 'Amount', cell: (p) => <CurrencyDisplay amount={p.amount} className="font-bold text-emerald-600" /> },
  ];

  const expenseColumns: Column<Expense>[] = [
    { header: 'Expense #', accessorKey: 'expenseNumber' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Vendor', accessorKey: 'vendorName' },
    { header: 'Date', cell: (e) => <DateDisplay date={e.date} /> },
    { header: 'Amount', cell: (e) => <CurrencyDisplay amount={e.amount} className="font-bold" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.displayName}
        subtitle={`${customer.companyName || customer.email} • ${customer.customerType.toUpperCase()}`}
        breadcrumbs={[
          { label: 'Customers', href: '/app/customers' },
          { label: customer.displayName },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditFormOpen(true)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button size="sm" onClick={() => router.push(`/app/invoices/new?customerId=${customer.id}`)}>
              <Receipt className="h-4 w-4 mr-1" /> New Invoice
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push(`/app/quotes/new?customerId=${customer.id}`)}>
              <FilePlus className="h-4 w-4 mr-1" /> New Quote
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1 text-red-600" /> Expense
            </Button>
          </div>
        }
      />

      {/* Customer 360 Top Card */}
      <CustomerSummaryCard customer={customer} />

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Address Card */}
            <div className="p-4 rounded-lg border border-border bg-surface text-xs space-y-2">
              <h4 className="font-bold text-sm text-foreground">Billing Address</h4>
              <p className="text-muted-foreground leading-relaxed">
                {customer.billingAddress.street}
                <br />
                {customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.postalCode}
                <br />
                {customer.billingAddress.country}
              </p>
            </div>

            {/* Shipping Address Card */}
            <div className="p-4 rounded-lg border border-border bg-surface text-xs space-y-2">
              <h4 className="font-bold text-sm text-foreground">Shipping Address</h4>
              <p className="text-muted-foreground leading-relaxed">
                {customer.sameAsBillingAddress
                  ? 'Same as Billing Address'
                  : `${customer.shippingAddress.street}, ${customer.shippingAddress.city}, ${customer.shippingAddress.state} ${customer.shippingAddress.postalCode}, ${customer.shippingAddress.country}`}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="pt-4">
          <DataTable columns={invoiceColumns} data={invoices} keyExtractor={(inv) => inv.id} />
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="pt-4">
          <DataTable columns={quoteColumns} data={quotes} keyExtractor={(q) => q.id} />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="pt-4">
          <DataTable columns={paymentColumns} data={payments} keyExtractor={(p) => p.id} />
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="pt-4">
          <DataTable columns={expenseColumns} data={expenses} keyExtractor={(e) => e.id} />
        </TabsContent>

        {/* Activity History Tab */}
        <TabsContent value="activity" className="pt-4 space-y-3">
          <div className="p-4 rounded-lg border border-border bg-surface text-xs space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <p className="font-semibold text-foreground">Customer account initialized</p>
                <p className="text-muted-foreground text-[11px]">{customer.createdAt}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <CustomerFormDialog
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        customerToEdit={customer}
        onSuccess={() => loadCustomerData()}
      />

      {/* Record Payment Dialog */}
      {paymentInvoice && (
        <RecordPaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(open) => !open && setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSuccess={() => loadCustomerData()}
        />
      )}

      {/* Add Expense Dialog */}
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSuccess={() => loadCustomerData()}
      />
    </div>
  );
}
