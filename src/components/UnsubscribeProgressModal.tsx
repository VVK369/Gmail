import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface UnsubscribeProgressModalProps {
  isOpen: boolean;
  total: number;
  current: number;
  currentServiceName: string;
  isComplete: boolean;
  completedCount: number;
  emailsCleanedCount: number;
  onClose: () => void;
  onViewHistory: () => void;
}

export const UnsubscribeProgressModal: React.FC<UnsubscribeProgressModalProps> = ({
  isOpen,
  total,
  current,
  currentServiceName,
  isComplete,
  completedCount,
  emailsCleanedCount,
  onClose,
  onViewHistory,
}) => {
  useEffect(() => {
    if (isComplete && isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti is decorative
      }
    }
  }, [isComplete, isOpen]);

  if (!isOpen) return null;

  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {!isComplete ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <span className="w-7 h-7 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
            </div>

            <div>
              <h3 id="progress-modal-title" className="text-base font-bold text-slate-900">
                Unsubscribing in Progress
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Processing {current} of {total} subscriptions...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>{progressPercent}% completed</span>
                <span>{total - current} remaining</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 font-mono truncate">
              Current: <span className="font-semibold text-slate-900">{currentServiceName || 'Preparing request...'}</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 id="progress-modal-title" className="text-lg font-bold text-slate-900">
                Successfully Unsubscribed!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Unsubscribe requests sent and recorded in your permanent history log.
              </p>
            </div>

            {/* Cleaned stats */}
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-xl font-extrabold text-emerald-700">{completedCount}</div>
                <div className="text-[11px] text-emerald-800 font-medium">Services Removed</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="text-xl font-extrabold text-indigo-700">{emailsCleanedCount}</div>
                <div className="text-[11px] text-indigo-800 font-medium">Emails Archived</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onViewHistory}
                aria-label="View history log"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                View Unsubscribed History
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Done and return"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
