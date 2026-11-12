import React, { useState } from 'react';
import { UnsubscribedHistoryEntry, SubscriptionCategory } from '../types/subscription';
import { ALL_CATEGORIES, CATEGORIES_META } from '../utils/categorizer';
import { CategoryBadge } from './CategoryBadge';
import { exportHistoryAsCsv, exportHistoryAsJson } from '../services/historyStorage';
import {
  History,
  Search,
  Download,
  Trash2,
  Calendar,
  Mail,
  ShieldCheck,
  Inbox,
  Filter,
} from 'lucide-react';

interface HistoryViewProps {
  history: UnsubscribedHistoryEntry[];
  onClearHistory: () => void;
  onNavigateToSubscriptions: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onNavigateToSubscriptions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory | 'all'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter history
  const filteredHistory = history.filter((entry) => {
    const matchesSearch =
      entry.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.senderDomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCleanedEmails = history.reduce((sum, item) => sum + (item.emailsCleanedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Unsubscribed Services History</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit log of all subscriptions you have unsubscribed from, along with assigned categories and date records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={history.length === 0}
            onClick={() => exportHistoryAsCsv(history)}
            aria-label="Export history to CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            disabled={history.length === 0}
            onClick={() => exportHistoryAsJson(history)}
            aria-label="Export history to JSON"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export JSON
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              aria-label="Clear history records"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{history.length}</div>
            <div className="text-xs text-slate-500 font-medium">Services Unsubscribed</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{totalCleanedEmails}</div>
            <div className="text-xs text-slate-500 font-medium">Emails Archived / Cleaned</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {history.length > 0 ? new Date(history[0].unsubscribedAt).toLocaleDateString() : 'No activity yet'}
            </div>
            <div className="text-xs text-slate-500 font-medium">Last Unsubscribe Action</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service name or email..."
            aria-label="Search unsubscribed history"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium">Filter Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SubscriptionCategory | 'all')}
            aria-label="Filter history by category"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories ({history.length})</option>
            {ALL_CATEGORIES.map((catKey) => {
              const count = history.filter((h) => h.category === catKey).length;
              return (
                <option key={catKey} value={catKey}>
                  {CATEGORIES_META[catKey].label} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* History Items List / Table */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {history.length === 0 ? 'No Unsubscribed Services Logged Yet' : 'No Matching Log Entries Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            {history.length === 0
              ? 'When you select and unsubscribe from subscriptions, every service name, category, and date will automatically be logged here for your reference.'
              : 'Try adjusting your search keywords or resetting your category filter to see other logged entries.'}
          </p>
          {history.length === 0 && (
            <button
              type="button"
              onClick={onNavigateToSubscriptions}
              aria-label="View active subscriptions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Browse Subscriptions to Clean
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Service / Sender
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Unsubscribed Date
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Method Used
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Emails Cleaned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{item.serviceName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.senderEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={item.category} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium text-slate-800">
                        {new Date(item.unsubscribedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(item.unsubscribedAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-indigo-600">{item.emailsCleanedCount}</span>
                      <span className="text-slate-400 text-[11px] ml-1">emails</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation modal for clearing history */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Clear Unsubscribed History?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete all {history.length} audit records from your local history? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
