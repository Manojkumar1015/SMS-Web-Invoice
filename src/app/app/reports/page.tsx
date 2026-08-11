'use client';

import * as React from 'react';
import { reportService } from '@/services';
import { RevenueChartPoint, ExpenseCategoryBreakdown } from '@/types/report';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
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

export default function ReportsPage() {
  const { toast } = useToast();
  const [chartData, setChartData] = React.useState<RevenueChartPoint[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = React.useState<ExpenseCategoryBreakdown[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [cData, expBreak] = await Promise.all([
          reportService.getRevenueChartData(),
          reportService.getExpenseBreakdown(),
        ]);
        setChartData(cData);
        setExpenseBreakdown(expBreak);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626'];

  const handleExport = (formatType: string) => {
    toast({
      title: `Export Initiated (${formatType})`,
      description: 'Simulating document export generation...',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports & Analytics"
        subtitle="Comprehensive revenue audits, GST tax liabilities, and expense breakdowns."
        actions={
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => handleExport('CSV')}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Audit Report
            </Button>
          </div>
        }
      />

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Profit & Revenue Trend Bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Net Profit & Revenue Comparison</CardTitle>
            <CardDescription>Monthly billing performance audit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="netProfit" fill="#059669" radius={[4, 4, 0, 0]} name="Net Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Category Breakdown</CardTitle>
            <CardDescription>Expenditure by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {expenseBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2 text-xs">
              {expenseBreakdown.map((item, idx) => (
                <div key={item.category} className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center space-x-2 truncate">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{item.category}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Liability Audit Table Simulation */}
      <Card>
        <CardHeader>
          <CardTitle>GST Tax Liabilities & Output Summary</CardTitle>
          <CardDescription>Simulated GST tax collection breakdown (18% / 12% / 5%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface text-xs">
            <table className="w-full text-left">
              <thead className="bg-surface-hover text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Tax Slab</th>
                  <th className="px-4 py-3 text-right">Taxable Turnover</th>
                  <th className="px-4 py-3 text-right">CGST (9%)</th>
                  <th className="px-4 py-3 text-right">SGST (9%)</th>
                  <th className="px-4 py-3 text-right">IGST (18%)</th>
                  <th className="px-4 py-3 text-right font-bold text-foreground">Total GST Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                <tr>
                  <td className="px-4 py-3 font-sans font-semibold text-foreground">18% Standard GST</td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={1500000} /></td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={67500} /></td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={67500} /></td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={135000} /></td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600"><CurrencyDisplay amount={270000} /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-sans font-semibold text-foreground">12% Hardware GST</td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={290000} /></td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={17400} /></td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={17400} /></td>
                  <td className="px-4 py-3 text-right"><CurrencyDisplay amount={0} /></td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600"><CurrencyDisplay amount={34800} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
