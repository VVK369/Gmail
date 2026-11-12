import React, { useState } from 'react';
import { SubscriptionItem, SubscriptionCategory, UnsubscribeConfirmationOptions } from '../types/subscription';
import { ALL_CATEGORIES, CATEGORIES_META } from '../utils/categorizer';
import { CategoryBadge } from './CategoryBadge';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Mail,
  Archive,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  items: SubscriptionItem[];
  onClose: () => void;
  onConfirm: (options: UnsubscribeConfirmationOptions) => void;
  isProcessing?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  items,
  onClose,
  onConfirm,
  isProcessing = false,
}) => {
  if (!isOpen || items.length === 0) return null;

  // Local state for category assignments per item
  const [assignedCategories, setAssignedCategories] = useState<Record<string, SubscriptionCategory>>(() => {
    const initial: Record<string, SubscriptionCategory> = {};
    for (const item of items) {
      initial[item.id] = item.category;
    }
    return initial;
  });

  const [sendUnsubscribeEmail, setSendUnsubscribeEmail] = useState(true);
  const [archiveOrTrashEmails, setArchiveOrTrashEmails] = useState<'archive' | 'trash' | 'keep'>('archive');
  const [bulkCategory, setBulkCategory] = useState<SubscriptionCategory | ''>('');

  const handleCategoryChange = (itemId: string, category: SubscriptionCategory) => {
    setAssignedCategories((prev) => ({
      ...prev,
      [itemId]: category,
    }));
  };

  const handleApplyBulkCategory = (category: SubscriptionCategory) => {
    setBulkCategory(category);
    setAssignedCategories((prev) => {
      const updated = { ...prev };
      for (const item of items) {
        updated[item.id] = category;
      }
      return updated;
    });
  };

  const handleProceed = () => {
    onConfirm({
      items,
      sendUnsubscribeEmail,
      archiveOrTrashEmails,
      assignedCategories,
    });
  };

  const totalEmailsAffected = items.reduce((acc, item) => acc + item.messageCount, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-rose-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="confirmation-modal-title" className="text-lg font-bold text-slate-900">
                Confirm Unsubscribe Action
              </h2>
              <p className="text-xs text-slate-500">
                {items.length === 1
                  ? 'Review category and confirm unsubscribing from this service'
                  : `Review categories and confirm unsubscribing from ${items.length} subscriptions`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close confirmation dialog"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Action Statement Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 space-y-1.5">
            <div className="font-semibold text-rose-950 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Action being taken:
            </div>
            <p className="text-xs leading-relaxed text-rose-800">
              You are about to unsubscribe from <strong className="font-bold underline">{items.length} {items.length === 1 ? 'subscription' : 'subscriptions'}</strong> (affecting {totalEmailsAffected} emails). We will send official unsubscribe requests to their mailing list handlers, log the services to your permanent history, and clean your mailbox.
            </p>
          </div>

          {/* Prompt to Assign / Review Categories */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Subscription Categories (Prompted for analysis)
                </label>
                <p className="text-xs text-slate-500">
                  Assign or adjust the category for each service. These will be saved for future reference and trend analysis.
                </p>
              </div>

              {/* Quick Bulk Assign */}
              {items.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 font-medium">Set all to:</span>
                  <select
                    value={bulkCategory}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApplyBulkCategory(e.target.value as SubscriptionCategory);
                      }
                    }}
                    aria-label="Set category for all items"
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Choose category...</option>
                    {ALL_CATEGORIES.map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {CATEGORIES_META[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List of Affected Items with Category Dropdowns */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/50">
              {items.map((item) => {
                const currentCat = assignedCategories[item.id] || item.category;
                return (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {item.serviceName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          {item.senderEmail}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.messageCount} emails • Latest: {item.sampleSubject}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <CategoryBadge
                        category={currentCat}
                        isEditable={true}
                        onSelectCategory={(cat) => handleCategoryChange(item.id, cat)}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Options */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Execution Settings
            </h3>

            {/* Send Unsubscribe Request */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={sendUnsubscribeEmail}
                onChange={(e) => setSendUnsubscribeEmail(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Send Unsubscribe Requests (Recommended)
                </div>
                <div className="text-slate-500 mt-0.5">
                  Sends automated one-click email or dispatches RFC 8058 header requests to notify senders to remove your address.
                </div>
              </div>
            </label>

            {/* Mailbox Cleanup Options */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Mailbox Cleanup Action
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setArchiveOrTrashEmails('archive')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                    archiveOrTrashEmails === 'archive'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Archive className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div>Archive Emails</div>
                    <div className="text-[10px] font-normal text-slate-500">Remove from Inbox</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setArchiveOrTrashEmails('trash')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                    archiveOrTrashEmails === 'trash'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 font-semibold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <div>Move to Trash</div>
                    <div className="text-[10px] font-normal text-slate-500">Delete from Inbox</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setArchiveOrTrashEmails('keep')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                    archiveOrTrashEmails === 'keep'
                      ? 'border-slate-800 bg-slate-100 text-slate-900 font-semibold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <div>Keep in Inbox</div>
                    <div className="text-[10px] font-normal text-slate-500">Unsubscribe only</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Clear Cancel and Confirm buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cancel unsubscribe and return"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel (Abort with no changes)
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={isProcessing}
            aria-label="Confirm and unsubscribe from selected subscriptions"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing Unsubscribes...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                Confirm & Unsubscribe from {items.length} {items.length === 1 ? 'Subscription' : 'Subscriptions'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
