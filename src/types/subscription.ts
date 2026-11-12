export type SubscriptionCategory =
  | 'newsletters'
  | 'ecommerce'
  | 'tech'
  | 'finance'
  | 'social'
  | 'travel'
  | 'entertainment'
  | 'other';

export interface CategoryMeta {
  id: SubscriptionCategory;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
}

export interface SubscriptionItem {
  id: string; // unique ID, e.g. clean sender email or hash
  serviceName: string;
  senderEmail: string;
  senderDomain: string;
  latestDate: string; // ISO string or human string
  messageCount: number;
  sampleSubject: string;
  listUnsubscribeHeader?: string;
  listUnsubscribePost?: string;
  unsubscribeUrl?: string;
  unsubscribeMailto?: string;
  category: SubscriptionCategory;
  status: 'active' | 'unsubscribing' | 'unsubscribed' | 'failed';
  errorMessage?: string;
  messageIds: string[]; // Gmail message IDs to archive/trash
}

export interface UnsubscribedHistoryEntry {
  id: string;
  serviceName: string;
  senderEmail: string;
  senderDomain: string;
  category: SubscriptionCategory;
  unsubscribedAt: string; // ISO string
  method: 'RFC 8058 One-Click' | 'Mailto Unsubscribe' | 'Direct Web Link' | 'Inbox Cleaned & Filtered';
  emailsCleanedCount: number;
  notes?: string;
}

export interface UnsubscribeConfirmationOptions {
  items: SubscriptionItem[];
  sendUnsubscribeEmail: boolean;
  archiveOrTrashEmails: 'archive' | 'trash' | 'keep';
  assignedCategories: Record<string, SubscriptionCategory>;
}

export interface ScanProgress {
  isScanning: boolean;
  totalFetched: number;
  subscriptionsDetected: number;
  currentStep: string;
  error?: string;
}
