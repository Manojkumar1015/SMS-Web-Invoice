'use client';

import * as React from 'react';
import { itemService } from '@/services';
import { Item } from '@/types/item';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { ItemTypeBadge } from '@/components/domain/item/item-type-badge';
import { ItemFormDialog } from '@/components/domain/item/item-form-dialog';
import { PackagePlus, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

export default function ItemsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  // Form & Delete states
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<Item | null>(null);

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemService.getItems({
        search,
        type: typeFilter,
        status: statusFilter,
      });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await itemService.deleteItem(deletingItem.id);
      toast({
        title: 'Item Deleted',
        description: `${deletingItem.name} has been removed from catalog.`,
        variant: 'success',
      });
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setDeletingItem(null);
      fetchItems();
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Could not delete item.',
        variant: 'destructive',
      });
    }
  };

  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/v1/profile')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.role) {
          setUserRole(json.data.role);
        }
      })
      .catch(() => {});
  }, []);

  const canDelete = userRole === 'Owner' || userRole === 'Admin';

  const columns: Column<Item>[] = [
    {
      header: 'Item / Service',
      cell: (item) => (
        <div>
          <div className="font-semibold text-foreground">{item.name}</div>
          {item.description && (
            <div className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</div>
          )}
        </div>
      ),
    },
    { header: 'Type', cell: (item) => <ItemTypeBadge type={item.itemType || item.type} /> },
    {
      header: 'Category',
      cell: (item) => <span className="text-xs font-medium text-slate-600">{item.category || 'General'}</span>,
    },
    {
      header: 'HSN/SAC',
      cell: (item) => {
        const itemType = item.itemType || (item.type === 'service' ? 'Service' : 'Product');
        const code = item.classification?.code || item.hsnSac;
        if (code) {
          const typeLabel = item.classification?.classificationType || (itemType === 'Product' ? 'HSN' : 'SAC');
          return <span className="font-mono text-xs font-semibold text-indigo-700">{typeLabel} {code}</span>;
        }
        if (itemType === 'Service') {
          return <span className="text-xs text-slate-400 italic">SAC — Not configured</span>;
        }
        return <span className="text-xs text-slate-400">—</span>;
      },
    },
    {
      header: 'Tax',
      cell: (item) => <span className="font-semibold text-emerald-600">{item.taxRate}%</span>,
    },
    {
      header: 'Price',
      cell: (item) => (
        <div>
          <CurrencyDisplay amount={item.sellingPrice} className="font-bold text-foreground" />
          <span className="text-[10px] text-slate-400"> / {item.unit}</span>
        </div>
      ),
    },
    { header: 'Status', cell: (item) => <StatusBadge status={item.status} /> },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setFormOpen(true);
            }}
          >
            <Edit className="h-3.5 w-3.5 text-slate-600" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:text-red-700"
              onClick={() => setDeletingItem(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Services Catalog"
        subtitle="Manage billing rate cards, HSN/SAC codes, and GST percentage tiers."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            <PackagePlus className="h-4 w-4 mr-1.5" />
            New Item
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search items by name, SKU..." />
        <FilterBar
          options={[
            { value: 'all', label: 'All Types', count: items.length },
            { value: 'product', label: 'Products' },
            { value: 'service', label: 'Services' },
          ]}
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(i) => i.id}
        isLoading={loading}
        emptyMessage="No catalog items found. Click 'New Item' to register your products or services."
      />

      {/* Add / Edit Form Drawer */}
      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        itemToEdit={editingItem}
        onSuccess={() => fetchItems()}
      />

      {/* Confirm Delete */}
      {deletingItem && (
        <ConfirmDialog
          open={!!deletingItem}
          onOpenChange={(open) => !open && setDeletingItem(null)}
          title="Delete Catalog Item?"
          description={`Are you sure you want to remove ${deletingItem.name}?`}
          confirmLabel="Delete Item"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
