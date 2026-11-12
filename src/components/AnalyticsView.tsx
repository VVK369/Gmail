import React from 'react';
import { SubscriptionItem, UnsubscribedHistoryEntry, SubscriptionCategory } from '../types/subscription';
import { ALL_CATEGORIES, CATEGORIES_META } from '../utils/categorizer';
import {
  BarChart3,
  Clock,
  Sparkles,
  Inbox,
  TrendingUp,
  PieChart,
} from 'lucide-react';

interface AnalyticsViewProps {
  activeSubscriptions: SubscriptionItem[];
  history: UnsubscribedHistoryEntry[];
  onSelectCategoryFilter: (category: SubscriptionCategory) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  activeSubscriptions,
  history,
  onSelectCategoryFilter,
}) => {
  // Combine stats across active subscriptions and unsubscribed history
  const allRecordedItems = [
    ...activeSubscriptions.map((s) => ({
      category: s.category,
      count: s.messageCount,
      isUnsubscribed: false,
      name: s.serviceName,
    })),
    ...history.map((h) => ({
      category: h.category,
      count: h.emailsCleanedCount,
      isUnsubscribed: true,
      name: h.serviceName,
    })),
  ];

  const totalSubscriptionsTracked = activeSubscriptions.length + history.length;
  const totalEmailsTracked = allRecordedItems.reduce((acc, item) => acc + item.count, 0);

  // Group by category
  const categoryStats = ALL_CATEGORIES.map((catKey) => {
    const meta = CATEGORIES_META[catKey];
    const catItems = allRecordedItems.filter((i) => i.category === catKey);
    const activeCount = activeSubscriptions.filter((s) => s.category === catKey).length;
    const unsubCount = history.filter((h) => h.category === catKey).length;
    const emailCount = catItems.reduce((acc, i) => acc + i.count, 0);
    const subCount = activeCount + unsubCount;
    const percentage = totalSubscriptionsTracked > 0 ? Math.round((subCount / totalSubscriptionsTracked) * 100) : 0;

    return {
      category: catKey,
      meta,
      subCount,
      activeCount,
      unsubCount,
      emailCount,
      percentage,
    };
  }).sort((a, b) => b.subCount - a.subCount);

  // Estimated time saved calculation: ~1.5 minutes per promotional email dealt with
  const estimatedHoursSaved = ((history.reduce((sum, h) => sum + h.emailsCleanedCount, 0) * 1.5) / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Subscription & Category Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Breakdown of your email subscriptions by category to help you understand what dominates your inbox and track your declutter progress.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{totalSubscriptionsTracked}</div>
            <div className="text-xs text-slate-500 font-medium">Total Subscriptions Tracked</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {activeSubscriptions.length} active • {history.length} unsubscribed
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600">{estimatedHoursSaved} hrs</div>
            <div className="text-xs text-slate-500 font-medium">Estimated Reading Time Saved</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Based on unsubscribed mail volume</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">
              {totalSubscriptionsTracked > 0
                ? `${Math.round((history.length / totalSubscriptionsTracked) * 100)}%`
                : '0%'}
            </div>
            <div className="text-xs text-slate-500 font-medium">Inbox Declutter Rate</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{history.length} of {totalSubscriptionsTracked} unsubscribed</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Distribution by Category</h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any category to filter active subscriptions
          </span>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex">
          {categoryStats
            .filter((s) => s.percentage > 0)
            .map((stat) => (
              <div
                key={stat.category}
                title={`${stat.meta.label}: ${stat.percentage}%`}
                style={{
                  width: `${stat.percentage}%`,
                  backgroundColor: stat.meta.color,
                }}
                className="h-full transition-all hover:opacity-80 cursor-pointer"
                onClick={() => onSelectCategoryFilter(stat.category)}
              />
            ))}
        </div>

        {/* Category Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {categoryStats.map((stat) => {
            return (
              <button
                type="button"
                key={stat.category}
                onClick={() => onSelectCategoryFilter(stat.category)}
                aria-label={`Filter by ${stat.meta.label}`}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all text-left flex items-start justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: stat.meta.color }}
                    />
                    <span className="font-bold text-slate-900 text-xs">{stat.meta.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{stat.meta.description}</p>
                  <div className="text-[11px] text-slate-600 font-medium pt-1">
                    {stat.activeCount} active • {stat.unsubCount} unsubscribed ({stat.emailCount} emails total)
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-slate-900">{stat.percentage}%</span>
                  <div className="text-[10px] text-slate-400">{stat.subCount} services</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Insights Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50/40 rounded-2xl p-6 border border-indigo-100 text-xs text-indigo-950 space-y-2">
        <div className="font-bold text-sm text-indigo-950 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Subscription Optimization Insights
        </div>
        <p className="text-slate-600 leading-relaxed">
          {categoryStats[0]?.subCount > 0
            ? `Your largest volume of subscriptions comes from "${categoryStats[0].meta.label}" accounting for ${categoryStats[0].percentage}% of your tracked mailing lists. Reviewing and unsubscribing from this category yields the fastest inbox cleanliness improvements.`
            : 'Scan your mailbox or enable demo mode to review category distribution insights and reclaim your attention.'}
        </p>
      </div>
    </div>
  );
};
