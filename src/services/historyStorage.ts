import { UnsubscribedHistoryEntry } from '../types/subscription';

const HISTORY_STORAGE_KEY = 'unsubify_history_log';

export function getUnsubscribedHistory(): UnsubscribedHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse unsubscribed history:', err);
    return [];
  }
}

export function saveUnsubscribedHistory(history: UnsubscribedHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to save unsubscribed history:', err);
  }
}

export function logUnsubscribedEntry(entry: Omit<UnsubscribedHistoryEntry, 'id'>): UnsubscribedHistoryEntry {
  const fullEntry: UnsubscribedHistoryEntry = {
    ...entry,
    id: `unsub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  const existing = getUnsubscribedHistory();
  // Filter out any duplicate for this same sender if already present
  const updated = [fullEntry, ...existing.filter((e) => e.senderEmail.toLowerCase() !== entry.senderEmail.toLowerCase())];
  saveUnsubscribedHistory(updated);
  return fullEntry;
}

export function logMultipleUnsubscribedEntries(
  entries: Array<Omit<UnsubscribedHistoryEntry, 'id'>>
): UnsubscribedHistoryEntry[] {
  const existing = getUnsubscribedHistory();
  const created: UnsubscribedHistoryEntry[] = entries.map((entry, idx) => ({
    ...entry,
    id: `unsub-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
  }));

  const createdEmails = new Set(created.map((c) => c.senderEmail.toLowerCase()));
  const updated = [...created, ...existing.filter((e) => !createdEmails.has(e.senderEmail.toLowerCase()))];
  saveUnsubscribedHistory(updated);
  return created;
}

export function clearUnsubscribedHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

export function exportHistoryAsCsv(history: UnsubscribedHistoryEntry[]): void {
  if (!history.length) return;

  const headers = ['Service Name', 'Sender Email', 'Domain', 'Category', 'Unsubscribed Date', 'Method', 'Emails Cleaned'];
  const rows = history.map((entry) => [
    `"${entry.serviceName.replace(/"/g, '""')}"`,
    `"${entry.senderEmail.replace(/"/g, '""')}"`,
    `"${entry.senderDomain.replace(/"/g, '""')}"`,
    `"${entry.category}"`,
    `"${new Date(entry.unsubscribedAt).toLocaleString()}"`,
    `"${entry.method}"`,
    entry.emailsCleanedCount,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `unsubify-history-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportHistoryAsJson(history: UnsubscribedHistoryEntry[]): void {
  if (!history.length) return;

  const jsonContent = JSON.stringify(history, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `unsubify-history-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
