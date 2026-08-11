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

export default function ItemsPage() {
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
    await itemService.deleteItem(deletingItem.id);
    setDeletingItem(null);
    fetchItems();
  };

  const columns: Column<Item>[] = [
    {
      header: 'Item / Service Name',
      cell: (item) => (
        <div>
          <div className="font-semibold text-foreground">{item.name}</div>
          {item.description && (
            <div className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'SKU',
      cell: (item) => <span className="font-mono text-xs font-medium">{item.sku}</span>,
    },
    { header: 'Type', cell: (item) => <ItemTypeBadge type={item.type} /> },
    {
      header: 'Selling Price',
      cell: (item) => (
        <div>
          <CurrencyDisplay amount={item.sellingPrice} className="font-bold text-foreground" />
          <span className="text-[10px] text-slate-400"> / {item.unit}</span>
        </div>
      ),
    },
    {
      header: 'Tax Rate',
      cell: (item) => <span className="font-semibold text-emerald-600">{item.taxRate}% GST</span>,
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            onClick={() => setDeletingItem(item)}
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
