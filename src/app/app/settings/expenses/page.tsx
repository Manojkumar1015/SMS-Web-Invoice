'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { ExpenseCategorySetting } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { ExpenseCategoryBadge } from '@/components/domain/expense/expense-category-badge';
import { Tag, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExpenseSettingsPage() {
  const { toast } = useToast();
  const [categories, setCategories] = React.useState<ExpenseCategorySetting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatDesc, setNewCatDesc] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    const res = await settingsService.getExpenseCategories();
    setCategories(res);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggle = async (cat: ExpenseCategorySetting) => {
    try {
      await settingsService.updateExpenseCategory(cat.id, { enabled: !cat.enabled });
      toast({ title: 'Category Updated', description: `${cat.name} category status updated.`, variant: 'info' });
      fetchCategories();
    } catch {
      toast({ title: 'Error', description: 'Could not update category status.', variant: 'destructive' });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmitting(true);
    try {
      await settingsService.addExpenseCategory(newCatName, newCatDesc);
      toast({ title: 'Category Created', description: `Added category ${newCatName}.`, variant: 'success' });
      setDialogOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch {
      toast({ title: 'Error', description: 'Could not create category.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading expense categories..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage business details, invoice numbering, tax configurations, and team roles."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNavigation />

        <div className="flex-1 space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Expense Categories Manager</CardTitle>
                </div>
                <CardDescription>Manage expense classification categories for vendor expenditure tracking.</CardDescription>
              </div>

              <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> + Add Category
              </Button>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Category Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="px-4 py-3 font-semibold">
                          <ExpenseCategoryBadge category={cat.name} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">{cat.description || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              cat.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {cat.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(cat)}
                            className="h-7 text-xs font-semibold text-slate-600 hover:text-indigo-600"
                          >
                            {cat.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Add Expense Category</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCategory} className="space-y-4 text-xs pt-2">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Category Name *</label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                placeholder="e.g. Legal & Audit Fees"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Description</label>
              <Input
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Category description..."
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
