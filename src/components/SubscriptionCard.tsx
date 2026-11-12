import React from 'react';
import { SubscriptionItem, SubscriptionCategory } from '../types/subscription';
import { CategoryBadge } from './CategoryBadge';
import {
  Mail,
  Calendar,
  ExternalLink,
  Ban,
  Check,
} from 'lucide-react';

interface SubscriptionCardProps {
  item: SubscriptionItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onCategoryChange: (id: string, category: SubscriptionCategory) => void;
  onUnsubscribeSingle: (item: SubscriptionItem) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onCategoryChange,
  onUnsubscribeSingle,
}) => {
  // Generate initials for avatar
  const initials = item.serviceName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SU';

  const isUnsubscribed = item.status === 'unsubscribed';

  return (
    <div
      onClick={() => !isUnsubscribed && onToggleSelect(item.id)}
      className={`group relative rounded-2xl border transition-all p-4.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none ${
        isUnsubscribed
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : isSelected
          ? 'bg-indigo-50/50 border-indigo-300 shadow-sm ring-1 ring-indigo-200'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Left: Checkbox & Service Info */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Custom Checkbox */}
        <div
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Select ${item.serviceName}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggleSelect(item.id);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(item.id);
          }}
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors ${
            isSelected
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>

        {/* Service Initials Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-xs">
          {initials}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm truncate">{item.serviceName}</h3>
            <CategoryBadge
              category={item.category}
              isEditable={!isUnsubscribed}
              onSelectCategory={(cat) => onCategoryChange(item.id, cat)}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
            <span className="font-mono text-[11px] text-slate-600 truncate">{item.senderEmail}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Mail className="w-3 h-3 text-slate-400" />
              {item.messageCount} emails
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              {item.latestDate}
            </span>
          </div>

          <p className="text-xs text-slate-500 truncate mt-1 italic">
            "{item.sampleSubject}"
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {item.unsubscribeUrl && (
          <a
            href={item.unsubscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Open direct unsubscribe link for ${item.serviceName}`}
            title="Open direct unsubscribe link in new tab"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <button
          type="button"
          disabled={isUnsubscribed}
          onClick={(e) => {
            e.stopPropagation();
            onUnsubscribeSingle(item);
          }}
          aria-label={`Unsubscribe from ${item.serviceName}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40"
        >
          <Ban className="w-3.5 h-3.5" />
          Unsubscribe
        </button>
      </div>
    </div>
  );
};
