import React from 'react';
import { User } from 'firebase/auth';
import {
  Inbox,
  History,
  BarChart3,
  LogOut,
  MailCheck,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'subscriptions' | 'history' | 'analytics';
  onTabChange: (tab: 'subscriptions' | 'history' | 'analytics') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  subscriptionsCount: number;
  historyCount: number;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  subscriptionsCount,
  historyCount,
  isDemoMode,
  onToggleDemoMode,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-rose-500 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Unsubify</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                  Gmail
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Subscription & Newsletter Cleaner
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => onTabChange('subscriptions')}
              aria-label="View Subscriptions"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Subscriptions</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'subscriptions'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {subscriptionsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('history')}
              aria-label="View Unsubscribed History"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History Log</span>
              {historyCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'history'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {historyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('analytics')}
              aria-label="View Category Analytics"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Category Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </button>
          </nav>

          {/* Right Section: Mode & Google Sign In */}
          <div className="flex items-center gap-2.5">
            {/* Interactive Demo Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDemoMode}
              title={isDemoMode ? 'Currently showing interactive demo data' : 'Switch to demo sample subscriptions'}
              aria-label="Toggle demo mode"
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isDemoMode ? 'Demo Mode Active' : 'Test Mode'}</span>
            </button>

            {/* Official Google Sign-In or User Profile */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User profile'}
                      className="w-8 h-8 rounded-full border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden lg:block text-left text-xs">
                    <div className="font-bold text-slate-900 truncate max-w-[130px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {user.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out from Google"
                  aria-label="Sign out"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Official Google Sign-In Button per Workspace SKILL.md specs */
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                aria-label="Sign in with Google"
                className="gsi-material-button shadow-xs"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
