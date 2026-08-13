import { createClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/api/errors';

export class ReportRepository {
  async getDashboardSummary(organizationId: string, startDate?: string, endDate?: string) {
    const supabase = createClient();

    let invQuery = (supabase.from('invoices' as any) as any)
      .select('total, amount_paid, balance_due, status, invoice_date')
      .eq('organization_id', organizationId);

    let expQuery = (supabase.from('expenses' as any) as any)
      .select('amount, expense_date')
      .eq('organization_id', organizationId);

    if (startDate) {
      invQuery = invQuery.gte('invoice_date', startDate);
      expQuery = expQuery.gte('expense_date', startDate);
    }
    if (endDate) {
      invQuery = invQuery.lte('invoice_date', endDate);
      expQuery = expQuery.lte('expense_date', endDate);
    }

    const { data: invoices, error: invErr } = await invQuery;
    if (invErr) throw new DatabaseError(`Failed to aggregate invoices: ${invErr.message}`);

    const { data: expenses, error: expErr } = await expQuery;
    if (expErr) throw new DatabaseError(`Failed to aggregate expenses: ${expErr.message}`);

    let totalRevenue = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let paidInvoiceCount = 0;
    let pendingInvoiceCount = 0;
    let overdueInvoiceCount = 0;

    (invoices || []).forEach((inv: any) => {
      const tot = Number(inv.total) || 0;
      const paid = Number(inv.amount_paid) || 0;
      const bal = Number(inv.balance_due) || 0;

      totalRevenue += tot;
      totalReceived += paid;
      totalOutstanding += bal;

      if (inv.status === 'paid') paidInvoiceCount++;
      else if (inv.status === 'overdue') overdueInvoiceCount++;
      else pendingInvoiceCount++;
    });

    let totalExpenses = 0;
    (expenses || []).forEach((exp: any) => {
      totalExpenses += Number(exp.amount) || 0;
    });

    const netProfit = totalReceived - totalExpenses;

    return {
      revenue: totalRevenue,
      received: totalReceived,
      outstanding: totalOutstanding,
      expenses: totalExpenses,
      netProfit,
      paidInvoiceCount,
      pendingInvoiceCount,
      overdueInvoiceCount,
      invoiceCount: (invoices || []).length,
      expenseCount: (expenses || []).length,
    };
  }

  async getRecentActivity(organizationId: string) {
    const supabase = createClient();

    const { data: invoices } = await (supabase.from('invoices' as any) as any)
      .select('*, customer:customers(display_name, company_name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: payments } = await (supabase.from('payments' as any) as any)
      .select('*, customer:customers(display_name, company_name), invoice:invoices(invoice_number)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      recentInvoices: invoices || [],
      recentPayments: payments || [],
    };
  }

  async globalSearch(organizationId: string, query: string) {
    if (!query || !query.trim()) return [];
    const supabase = createClient();
    const term = `%${query.trim()}%`;
    const results: Array<{ id: string; type: string; title: string; subtitle: string; href: string }> = [];

    // Search Customers
    const { data: customers } = await (supabase.from('customers' as any) as any)
      .select('id, display_name, customer_number, company_name')
      .eq('organization_id', organizationId)
      .or(`display_name.ilike.${term},company_name.ilike.${term},customer_number.ilike.${term}`)
      .limit(5);

    (customers || []).forEach((c: any) => {
      results.push({
        id: c.id,
        type: 'Customer',
        title: c.display_name || c.company_name,
        subtitle: `Customer #${c.customer_number}`,
        href: `/app/customers/${c.id}`,
      });
    });

    // Search Items
    const { data: items } = await (supabase.from('items' as any) as any)
      .select('id, name, item_code')
      .eq('organization_id', organizationId)
      .or(`name.ilike.${term},item_code.ilike.${term}`)
      .limit(5);

    (items || []).forEach((i: any) => {
      results.push({
        id: i.id,
        type: 'Item',
        title: i.name,
        subtitle: `Item Code: ${i.item_code}`,
        href: `/app/items/${i.id}`,
      });
    });

    // Search Invoices
    const { data: invoices } = await (supabase.from('invoices' as any) as any)
      .select('id, invoice_number, total, status')
      .eq('organization_id', organizationId)
      .or(`invoice_number.ilike.${term}`)
      .limit(5);

    (invoices || []).forEach((inv: any) => {
      results.push({
        id: inv.id,
        type: 'Invoice',
        title: inv.invoice_number,
        subtitle: `Total: ₹${inv.total} (${inv.status})`,
        href: `/app/invoices/${inv.id}`,
      });
    });

    // Search Quotes
    const { data: quotes } = await (supabase.from('quotes' as any) as any)
      .select('id, quote_number, total, status')
      .eq('organization_id', organizationId)
      .or(`quote_number.ilike.${term}`)
      .limit(5);

    (quotes || []).forEach((q: any) => {
      results.push({
        id: q.id,
        type: 'Quote',
        title: q.quote_number,
        subtitle: `Total: ₹${q.total} (${q.status})`,
        href: `/app/quotes/${q.id}`,
      });
    });

    return results;
  }
}
