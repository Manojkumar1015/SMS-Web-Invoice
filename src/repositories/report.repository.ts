import { createClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/api/errors';
import { roundCurrency } from '@/lib/financial';

export class ReportRepository {
  async getDashboardSummary(organizationId: string, startDate?: string, endDate?: string) {
    const supabase = createClient();

    let invQuery = (supabase.from('invoices' as any) as any)
      .select('id, total, amount_paid, balance_due, status, invoice_date')
      .eq('organization_id', organizationId);

    let payQuery = (supabase.from('payments' as any) as any)
      .select('amount, payment_date')
      .eq('organization_id', organizationId);

    let expQuery = (supabase.from('expenses' as any) as any)
      .select('amount, expense_date')
      .eq('organization_id', organizationId);

    if (startDate) {
      invQuery = invQuery.gte('invoice_date', `${startDate}T00:00:00.000Z`);
      payQuery = payQuery.gte('payment_date', `${startDate}T00:00:00.000Z`);
      expQuery = expQuery.gte('expense_date', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      invQuery = invQuery.lte('invoice_date', `${endDate}T23:59:59.999Z`);
      payQuery = payQuery.lte('payment_date', `${endDate}T23:59:59.999Z`);
      expQuery = expQuery.lte('expense_date', `${endDate}T23:59:59.999Z`);
    }

    const { data: invoices, error: invErr } = await invQuery;
    if (invErr) throw new DatabaseError(`Failed to aggregate invoices: ${invErr.message}`);

    const { data: payments, error: payErr } = await payQuery;
    if (payErr) throw new DatabaseError(`Failed to aggregate payments: ${payErr.message}`);

    const { data: expenses, error: expErr } = await expQuery;
    if (expErr) throw new DatabaseError(`Failed to aggregate expenses: ${expErr.message}`);

    // Customer count
    const { count: customerCount } = await (supabase.from('customers' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    let totalRevenue = 0;
    let totalOutstanding = 0;
    let paidInvoiceCount = 0;
    let pendingInvoiceCount = 0;
    let overdueInvoiceCount = 0;

    (invoices || []).forEach((inv: any) => {
      if (inv.status !== 'cancelled') {
        const tot = Number(inv.total) || 0;
        const bal = Number(inv.balance_due) || 0;
        totalRevenue += tot;
        totalOutstanding += bal;

        if (inv.status === 'paid') paidInvoiceCount++;
        else if (inv.status === 'overdue') overdueInvoiceCount++;
        else pendingInvoiceCount++;
      }
    });

    let totalReceived = 0;
    (payments || []).forEach((p: any) => {
      totalReceived += Number(p.amount) || 0;
    });

    let totalExpenses = 0;
    (expenses || []).forEach((exp: any) => {
      totalExpenses += Number(exp.amount) || 0;
    });

    totalRevenue = roundCurrency(totalRevenue);
    totalReceived = roundCurrency(totalReceived);
    totalOutstanding = roundCurrency(totalOutstanding);
    totalExpenses = roundCurrency(totalExpenses);
    const netProfit = roundCurrency(totalRevenue - totalExpenses);

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
      customerCount: customerCount || 0,
    };
  }

  async getRevenueChartData(organizationId: string, startDate?: string, endDate?: string) {
    const summary = await this.getDashboardSummary(organizationId, startDate, endDate);
    const today = new Date().toISOString().split('T')[0];

    return [
      {
        date: startDate || today,
        revenue: summary.revenue,
        payments: summary.received,
        expenses: summary.expenses,
        netProfit: summary.netProfit,
      },
      {
        date: endDate || today,
        revenue: summary.revenue,
        payments: summary.received,
        expenses: summary.expenses,
        netProfit: summary.netProfit,
      },
    ];
  }

  async getDetailedReports(organizationId: string, startDate?: string, endDate?: string) {
    const supabase = createClient();

    // 1. Invoices Report
    let invQ = (supabase.from('invoices' as any) as any)
      .select('*, customer:customers(display_name, company_name)')
      .eq('organization_id', organizationId);
    if (startDate) invQ = invQ.gte('invoice_date', `${startDate}T00:00:00.000Z`);
    if (endDate) invQ = invQ.lte('invoice_date', `${endDate}T23:59:59.999Z`);
    const { data: invoices } = await invQ;

    const invoiceStatusMap = new Map<string, { count: number; amount: number; outstanding: number }>();
    (invoices || []).forEach((inv: any) => {
      const st = inv.status || 'draft';
      const curr = invoiceStatusMap.get(st) || { count: 0, amount: 0, outstanding: 0 };
      curr.count += 1;
      curr.amount += Number(inv.total) || 0;
      curr.outstanding += Number(inv.balance_due) || 0;
      invoiceStatusMap.set(st, curr);
    });

    const invoiceByStatus = Array.from(invoiceStatusMap.entries()).map(([status, val]) => ({
      status,
      count: val.count,
      amount: roundCurrency(val.amount),
      outstanding: roundCurrency(val.outstanding),
    }));

    // 2. Payments Report
    let payQ = (supabase.from('payments' as any) as any)
      .select('*')
      .eq('organization_id', organizationId);
    if (startDate) payQ = payQ.gte('payment_date', `${startDate}T00:00:00.000Z`);
    if (endDate) payQ = payQ.lte('payment_date', `${endDate}T23:59:59.999Z`);
    const { data: payments } = await payQ;

    const paymentMethodMap = new Map<string, { count: number; amount: number }>();
    (payments || []).forEach((p: any) => {
      const m = p.payment_method || 'other';
      const curr = paymentMethodMap.get(m) || { count: 0, amount: 0 };
      curr.count += 1;
      curr.amount += Number(p.amount) || 0;
      paymentMethodMap.set(m, curr);
    });

    const paymentByMethod = Array.from(paymentMethodMap.entries()).map(([method, val]) => ({
      method,
      count: val.count,
      amount: roundCurrency(val.amount),
    }));

    // 3. Expenses Report
    let expQ = (supabase.from('expenses' as any) as any)
      .select('*')
      .eq('organization_id', organizationId);
    if (startDate) expQ = expQ.gte('expense_date', `${startDate}T00:00:00.000Z`);
    if (endDate) expQ = expQ.lte('expense_date', `${endDate}T23:59:59.999Z`);
    const { data: expenses } = await expQ;

    let totalExpAmount = 0;
    const expenseCategoryMap = new Map<string, number>();
    (expenses || []).forEach((e: any) => {
      const cat = e.category || 'Miscellaneous';
      const amt = Number(e.amount) || 0;
      totalExpAmount += amt;
      expenseCategoryMap.set(cat, (expenseCategoryMap.get(cat) || 0) + amt);
    });

    const expenseByCategory = Array.from(expenseCategoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: roundCurrency(amount),
      percentage: totalExpAmount > 0 ? roundCurrency((amount / totalExpAmount) * 100) : 0,
    }));

    // 4. Customer Performance Report
    const { data: customers } = await (supabase.from('customers' as any) as any)
      .select('id, display_name, company_name, total_invoiced, paid, outstanding')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(10);

    const customerReport = (customers || []).map((c: any) => {
      const revenue = Number(c.total_invoiced) || 0;
      const paid = Number(c.paid) || 0;
      const outstanding = Number(c.outstanding) || 0;
      return {
        id: c.id,
        customerName: c.display_name || c.company_name || 'Customer',
        invoicesCount: 1,
        revenue: roundCurrency(revenue),
        paid: roundCurrency(paid),
        outstanding: roundCurrency(outstanding),
        profitContribution: roundCurrency(revenue),
      };
    });

    // 5. Tax Report
    let totalTaxable = 0;
    let totalTax = 0;
    (invoices || []).forEach((inv: any) => {
      if (inv.status !== 'cancelled') {
        const sub = Number(inv.subtotal) || 0;
        const tax = Number(inv.tax) || 0;
        totalTaxable += sub;
        totalTax += tax;
      }
    });

    const cgst = roundCurrency(totalTax / 2);
    const sgst = roundCurrency(totalTax / 2);

    const taxSlabs = [
      {
        slabName: 'GST 18% Standard',
        taxableTurnover: roundCurrency(totalTaxable),
        cgst,
        sgst,
        igst: 0,
        totalGst: roundCurrency(totalTax),
      },
    ];

    return {
      invoiceByStatus,
      paymentByMethod,
      expenseByCategory,
      customerReport,
      taxReport: {
        taxableAmount: roundCurrency(totalTaxable),
        totalGst: roundCurrency(totalTax),
        slabs: taxSlabs,
      },
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
