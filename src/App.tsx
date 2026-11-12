import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  SubscriptionItem,
  UnsubscribedHistoryEntry,
  SubscriptionCategory,
  UnsubscribeConfirmationOptions,
} from './types/subscription';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebaseAuth';
import {
  scanGmailSubscriptions,
  executeUnsubscribe,
  getMockSubscriptions,
} from './services/gmailService';
import {
  getUnsubscribedHistory,
  logMultipleUnsubscribedEntries,
  clearUnsubscribedHistory,
} from './services/historyStorage';
import {
  saveCategoryOverride,
  saveMultipleCategoryOverrides,
} from './utils/categorizer';
import { Navbar } from './components/Navbar';
import { SubscriptionList } from './components/SubscriptionList';
import { ConfirmationModal } from './components/ConfirmationModal';
import { UnsubscribeProgressModal } from './components/UnsubscribeProgressModal';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import {
  ShieldAlert,
  Inbox,
  Sparkles,
  Zap,
  MailCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'history' | 'analytics'>('subscriptions');

  // Subscriptions & History
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => getMockSubscriptions());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<UnsubscribedHistoryEntry[]>(() => getUnsubscribedHistory());
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModalItems, setConfirmModalItems] = useState<SubscriptionItem[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Progress Modal state
  const [progressState, setProgressState] = useState({
    isOpen: false,
    total: 0,
    current: 0,
    currentServiceName: '',
    isComplete: false,
    completedCount: 0,
    emailsCleanedCount: 0,
  });

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setIsDemoMode(false);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Reload history from localStorage
  const refreshHistory = useCallback(() => {
    setHistory(getUnsubscribedHistory());
  }, []);

  // Scan live mailbox
  const handleLiveScan = useCallback(async (authToken: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const scanned = await scanGmailSubscriptions(authToken, 80, (_scanned, _found, status) => {
        setScanStatus(status);
      });
      setSubscriptions(scanned);
      setIsDemoMode(false);
      // Pre-select all by default for convenience
      setSelectedIds(scanned.map((s) => s.id));
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err?.message || 'Failed to scan mailbox. Please try again.');
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  }, []);

  // Login handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setIsDemoMode(false);
        await handleLiveScan(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage('Google Sign-In was cancelled or failed. You can still test with Demo Mode!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setIsDemoMode(true);
    setSubscriptions(getMockSubscriptions());
    setSelectedIds([]);
  };

  // Toggle demo mode
  const handleToggleDemoMode = () => {
    if (!isDemoMode) {
      setIsDemoMode(true);
      setSubscriptions(getMockSubscriptions());
      setSelectedIds([]);
    } else if (token) {
      setIsDemoMode(false);
      handleLiveScan(token);
    } else {
      // Re-seed demo
      setSubscriptions(getMockSubscriptions());
      setSelectedIds([]);
    }
  };

  // Single item selection toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(subscriptions.filter((s) => s.status === 'active').map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Category change for an individual subscription
  const handleCategoryChange = (id: string, category: SubscriptionCategory) => {
    const item = subscriptions.find((s) => s.id === id);
    if (item) {
      saveCategoryOverride(item.senderEmail, category);
      saveCategoryOverride(item.senderDomain, category);
    }

    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, category } : sub))
    );
  };

  // Bulk category assign
  const handleBulkCategoryAssign = (category: SubscriptionCategory) => {
    const overrides: Record<string, SubscriptionCategory> = {};
    for (const id of selectedIds) {
      const item = subscriptions.find((s) => s.id === id);
      if (item) {
        overrides[item.senderEmail] = category;
        overrides[item.senderDomain] = category;
      }
    }
    saveMultipleCategoryOverrides(overrides);

    setSubscriptions((prev) =>
      prev.map((sub) => (selectedIds.includes(sub.id) ? { ...sub, category } : sub))
    );
  };

  // Single unsubscribe button trigger
  const handleUnsubscribeSingle = (item: SubscriptionItem) => {
    setConfirmModalItems([item]);
    setIsConfirmModalOpen(true);
  };

  // Bulk unsubscribe button trigger (triggers confirmation modal)
  const handleUnsubscribeSelected = () => {
    const activeItems = subscriptions.filter((s) => s.status === 'active');
    const itemsToUnsubscribe =
      selectedIds.length > 0
        ? activeItems.filter((s) => selectedIds.includes(s.id))
        : activeItems;

    if (itemsToUnsubscribe.length === 0) return;

    setConfirmModalItems(itemsToUnsubscribe);
    setIsConfirmModalOpen(true);
  };

  // Final Unsubscribe Execution after Confirmation
  const handleConfirmExecution = async (options: UnsubscribeConfirmationOptions) => {
    setIsConfirmModalOpen(false);

    // Save all user assigned categories for future reference & analysis
    saveMultipleCategoryOverrides(options.assignedCategories);

    // Open progress modal
    setProgressState({
      isOpen: true,
      total: options.items.length,
      current: 0,
      currentServiceName: options.items[0]?.serviceName || '',
      isComplete: false,
      completedCount: 0,
      emailsCleanedCount: 0,
    });

    const newlyLoggedEntries: Array<Omit<UnsubscribedHistoryEntry, 'id'>> = [];
    let totalEmailsCleaned = 0;

    for (let i = 0; i < options.items.length; i++) {
      const item = options.items[i];
      const assignedCategory = options.assignedCategories[item.id] || item.category;

      setProgressState((prev) => ({
        ...prev,
        current: i + 1,
        currentServiceName: item.serviceName,
      }));

      let emailsCleaned = item.messageCount;
      let methodStr: UnsubscribedHistoryEntry['method'] = 'Inbox Cleaned & Filtered';

      if (!isDemoMode && token) {
        // Execute real live Gmail call
        const result = await executeUnsubscribe(token, item, options);
        emailsCleaned = result.emailsCleaned;
        methodStr = result.method as any;
      } else {
        // Simulated execution for demo mode
        await new Promise((resolve) => setTimeout(resolve, 350));
        methodStr = item.unsubscribeMailto
          ? 'Mailto Unsubscribe'
          : item.listUnsubscribePost?.includes('One-Click')
          ? 'RFC 8058 One-Click'
          : item.unsubscribeUrl
          ? 'Direct Web Link'
          : 'Inbox Cleaned & Filtered';
      }

      totalEmailsCleaned += emailsCleaned;

      newlyLoggedEntries.push({
        serviceName: item.serviceName,
        senderEmail: item.senderEmail,
        senderDomain: item.senderDomain,
        category: assignedCategory,
        unsubscribedAt: new Date().toISOString(),
        method: methodStr,
        emailsCleanedCount: emailsCleaned,
      });

      // Update item status in memory
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: 'unsubscribed', category: assignedCategory } : s))
      );
    }

    // Save to permanent history storage
    logMultipleUnsubscribedEntries(newlyLoggedEntries);
    refreshHistory();

    // Remove unsubscribed items from selection
    const unsubscribedIds = new Set(options.items.map((i) => i.id));
    setSelectedIds((prev) => prev.filter((id) => !unsubscribedIds.has(id)));

    // Set progress complete
    setProgressState((prev) => ({
      ...prev,
      isComplete: true,
      completedCount: options.items.length,
      emailsCleanedCount: totalEmailsCleaned,
    }));
  };

  const handleClearHistory = () => {
    clearUnsubscribedHistory();
    refreshHistory();
  };

  const activeSubscriptionsCount = subscriptions.filter((s) => s.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        subscriptionsCount={activeSubscriptionsCount}
        historyCount={history.length}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Demo Mode Notice Banner when not authenticated */}
        {!user && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
            <div className="space-y-1.5 relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs border border-indigo-400/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Interactive Subscription Manager</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Unsubscribe from all subscriptions with safety & categorization
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                Connect your Gmail account to scan live promotional newsletters and mailing lists, review and assign categories, and mass-unsubscribe with confirmation protection and audit logs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                aria-label="Connect Gmail Account"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MailCheck className="w-4 h-4 text-rose-500" />
                {isLoggingIn ? 'Connecting...' : 'Connect Gmail Account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDemoMode(true);
                  setSubscriptions(getMockSubscriptions());
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold border border-indigo-500/30 cursor-pointer transition-colors"
              >
                Explore Demo Mode
              </button>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        )}

        {/* Tab 1: Active Subscriptions List */}
        {activeTab === 'subscriptions' && (
          <SubscriptionList
            items={subscriptions}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onCategoryChange={handleCategoryChange}
            onBulkCategoryAssign={handleBulkCategoryAssign}
            onUnsubscribeSingle={handleUnsubscribeSingle}
            onUnsubscribeSelected={handleUnsubscribeSelected}
            onRefreshScan={() => {
              if (token) {
                handleLiveScan(token);
              } else {
                setSubscriptions(getMockSubscriptions());
                setSelectedIds([]);
              }
            }}
            isScanning={isScanning}
          />
        )}

        {/* Tab 2: Unsubscribed History */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onClearHistory={handleClearHistory}
            onNavigateToSubscriptions={() => setActiveTab('subscriptions')}
          />
        )}

        {/* Tab 3: Category Analytics */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            activeSubscriptions={subscriptions}
            history={history}
            onSelectCategoryFilter={(cat) => {
              setActiveTab('subscriptions');
            }}
          />
        )}
      </main>

      {/* Confirmation Dialog (Mandatory user request) */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        items={confirmModalItems}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmExecution}
      />

      {/* Unsubscribe Progress & Completion Celebration Modal */}
      <UnsubscribeProgressModal
        isOpen={progressState.isOpen}
        total={progressState.total}
        current={progressState.current}
        currentServiceName={progressState.currentServiceName}
        isComplete={progressState.isComplete}
        completedCount={progressState.completedCount}
        emailsCleanedCount={progressState.emailsCleanedCount}
        onClose={() => setProgressState((prev) => ({ ...prev, isOpen: false }))}
        onViewHistory={() => {
          setProgressState((prev) => ({ ...prev, isOpen: false }));
          setActiveTab('history');
        }}
      />
    </div>
  );
}
