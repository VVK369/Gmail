import React, { useState } from 'react';
import { SubscriptionItem, SubscriptionCategory } from '../types/subscription';
import { ALL_CATEGORIES, CATEGORIES_META } from '../utils/categorizer';
import { SubscriptionCard } from './SubscriptionCard';
import {
  Search,
  CheckSquare,
  Square,
  Ban,
  Layers,
  Sparkles,
  Inbox,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

interface SubscriptionListProps {
  items: SubscriptionItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCategoryChange: (id: string, category: SubscriptionCategory) => void;
  onBulkCategoryAssign: (category: SubscriptionCategory) => void;
  onUnsubscribeSingle: (item: SubscriptionItem) => void;
  onUnsubscribeSelected: () => void;
  onRefreshScan: () => void;
  isScanning?: boolean;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onCategoryChange,
  onBulkCategoryAssign,
  onUnsubscribeSingle,
  onUnsubscribeSelected,
  onRefreshScan,
  isScanning = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'emails' | 'name'>('emails');
  const [showBulkCategoryMenu, setShowBulkCategoryMenu] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sampleSubject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'emails') {
      return b.messageCount - a.messageCount;
    }
    return a.serviceName.localeCompare(b.serviceName);
  });

  const activeItemsCount = items.filter((i) => i.status === 'active').length;
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));
  const someFilteredSelected =
    filteredItems.some((item) => selectedIds.includes(item.id)) && !allFilteredSelected;

  const totalEmailsInView = sortedItems.reduce((acc, i) => acc + i.messageCount, 0);

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search newsletter name, email, or domain..."
              aria-label="Search active subscriptions"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Right controls: Sort and Refresh Scan */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort subscriptions"
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="emails">Most Emails</option>
                <option value="name">Service Name (A-Z)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onRefreshScan}
              disabled={isScanning}
              aria-label="Rescan mailbox"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isScanning ? 'animate-spin' : ''}`} />
              Rescan
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            aria-label="Show all categories"
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All Categories ({items.length})
          </button>
          {ALL_CATEGORIES.map((catKey) => {
            const meta = CATEGORIES_META[catKey];
            const count = items.filter((i) => i.category === catKey).length;
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                aria-label={`Filter by ${meta.label}`}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? `${meta.badgeBg} ${meta.badgeText} border ${meta.badgeBorder} shadow-xs font-bold ring-1 ring-indigo-200`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action & Selection Bar */}
      <div className="bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-20 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (allFilteredSelected) {
                onDeselectAll();
              } else {
                onSelectAll();
              }
            }}
            aria-label={allFilteredSelected ? 'Deselect all' : 'Select all visible subscriptions'}
            className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : someFilteredSelected ? (
              <Square className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-300" />
            )}
            <span>Select All Visible ({filteredItems.length})</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {selectedIds.length} selected
            </span>
          )}

          <span className="hidden md:inline text-xs text-slate-400">•</span>
          <span className="hidden md:inline text-xs text-slate-500">
            {totalEmailsInView} total emails in view
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedIds.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBulkCategoryMenu(!showBulkCategoryMenu)}
                aria-label="Assign category to selected items"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assign Category</span>
              </button>

              {showBulkCategoryMenu && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Set category for {selectedIds.length} items
                  </div>
                  {ALL_CATEGORIES.map((catKey) => {
                    const meta = CATEGORIES_META[catKey];
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => {
                          onBulkCategoryAssign(catKey);
                          setShowBulkCategoryMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Primary "Unsubscribe All" / "Unsubscribe Selected" Button */}
          <button
            type="button"
            disabled={selectedIds.length === 0 && activeItemsCount === 0}
            onClick={onUnsubscribeSelected}
            aria-label="Proceed to unsubscribe confirmation"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Ban className="w-4 h-4 text-rose-200" />
            <span>
              {selectedIds.length > 0
                ? `Unsubscribe Selected (${selectedIds.length})`
                : `Unsubscribe All (${activeItemsCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* Subscription Cards List */}
      {sortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {items.length === 0 ? 'Inbox Clean! No Active Subscriptions' : 'No Subscriptions Match Filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            {items.length === 0
              ? 'Congratulations! You have unsubscribed from all detected subscriptions. Check your Unsubscribe History tab to see past records.'
              : 'Try clearing your search query or selecting "All Categories" to view remaining items.'}
          </p>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedItems.map((item) => (
            <SubscriptionCard
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={onToggleSelect}
              onCategoryChange={onCategoryChange}
              onUnsubscribeSingle={onUnsubscribeSingle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
