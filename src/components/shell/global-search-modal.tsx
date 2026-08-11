'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Receipt, FileText, Package, CreditCard, X, ArrowRight } from 'lucide-react';
import { globalSearchService } from '@/services';
import { SearchResultItem } from '@/types/common';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Execute search on query change
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await globalSearchService.search(query);
        if (isMounted) {
          setResults(res);
          setSelectedIndex(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Arrow key navigation inside command palette
  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].url);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(url);
  };

  if (!open) return null;

  const typeIcons = {
    customer: <Users className="h-4 w-4 text-emerald-600 shrink-0" />,
    invoice: <Receipt className="h-4 w-4 text-blue-600 shrink-0" />,
    quote: <FileText className="h-4 w-4 text-indigo-600 shrink-0" />,
    item: <Package className="h-4 w-4 text-amber-600 shrink-0" />,
    payment: <CreditCard className="h-4 w-4 text-purple-600 shrink-0" />,
    expense: <FileText className="h-4 w-4 text-red-600 shrink-0" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Search Header Input */}
        <div className="flex items-center border-b border-border px-4 py-3 bg-surface">
          <Search className="h-4 w-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            placeholder="Type to search customers, invoices, quotes, items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInInput}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground mr-2">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Searching backend services...</div>
          ) : !query.trim() ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Type <span className="font-semibold text-foreground">&quot;Acme&quot;</span>, <span className="font-semibold text-foreground">&quot;INV&quot;</span>, or <span className="font-semibold text-foreground">&quot;Cloud&quot;</span> to see command palette results.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matches found for &quot;<span className="font-medium text-foreground">{query}</span>&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item.url)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2.5 text-xs cursor-pointer transition-colors',
                      isSelected ? 'bg-surface-hover text-foreground font-medium' : 'hover:bg-surface-hover/50'
                    )}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      {typeIcons[item.type]}
                      <div className="truncate">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-[11px] truncate mt-0.5">{item.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {item.status && <StatusBadge status={item.status} />}
                      <ArrowRight className={cn('h-3.5 w-3.5 opacity-0 transition-opacity', isSelected && 'opacity-100 text-accent')} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer command helper */}
        <div className="flex items-center justify-between border-t border-border bg-surface-hover/40 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="font-mono font-semibold">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono font-semibold">↵</kbd> select
            </span>
          </div>
          <span>SMS Web Invoice Command Palette</span>
        </div>
      </div>
    </div>
  );
}
