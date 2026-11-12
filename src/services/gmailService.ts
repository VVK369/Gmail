import { SubscriptionItem, UnsubscribeConfirmationOptions } from '../types/subscription';
import { parseSender, parseListUnsubscribe, createUnsubscribeEmailPayload } from '../utils/emailParser';
import { detectCategory, getSavedCategoryOverrides } from '../utils/categorizer';

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers: GmailMessageHeader[];
  };
}

export async function scanGmailSubscriptions(
  accessToken: string,
  maxMessagesToInspect: number = 70,
  onProgress?: (scanned: number, found: number, status: string) => void
): Promise<SubscriptionItem[]> {
  onProgress?.(0, 0, 'Connecting to Gmail API and searching messages...');

  // Search query targeting promotional newsletters and emails with unsubscribe headers
  const query = encodeURIComponent('category:promotions OR category:updates OR "unsubscribe" OR "opt-out"');
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${maxMessagesToInspect}`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${errorText}`);
  }

  const listData = await listRes.json();
  const messages: Array<{ id: string; threadId: string }> = listData.messages || [];

  if (messages.length === 0) {
    return [];
  }

  onProgress?.(0, 0, `Found ${messages.length} candidates. Analyzing headers...`);

  const subscriptionsMap = new Map<string, SubscriptionItem>();
  const savedOverrides = getSavedCategoryOverrides();

  // Inspect messages in concurrent batches of 10
  const batchSize = 10;
  let scannedCount = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (msg) => {
        try {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=List-Unsubscribe&metadataHeaders=List-Unsubscribe-Post`;
          const detailRes = await fetch(detailUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!detailRes.ok) return;

          const detail: GmailMessageDetail = await detailRes.json();
          const headers = detail.payload?.headers || [];

          const getHeader = (name: string) =>
            headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

          const fromVal = getHeader('From') || '';
          const subjectVal = getHeader('Subject') || '(No Subject)';
          const dateVal = getHeader('Date') || new Date().toISOString();
          const unsubHeader = getHeader('List-Unsubscribe');
          const unsubPostHeader = getHeader('List-Unsubscribe-Post');

          const parsedSender = parseSender(fromVal);
          const parsedUnsub = parseListUnsubscribe(unsubHeader, unsubPostHeader);

          // We consider it a subscription if it has a List-Unsubscribe header OR comes from common newsletter formats
          const isSubscription = Boolean(unsubHeader) || Boolean(parsedUnsub.webUrl) || Boolean(parsedUnsub.mailtoRecipient);

          if (isSubscription || fromVal.toLowerCase().includes('newsletter') || subjectVal.toLowerCase().includes('unsubscribe')) {
            const key = parsedSender.email.toLowerCase() || parsedSender.domain.toLowerCase();

            if (!subscriptionsMap.has(key)) {
              // Determine category: user saved override > auto detect
              const category =
                savedOverrides[key] ||
                savedOverrides[parsedSender.domain.toLowerCase()] ||
                detectCategory(parsedSender.email, parsedSender.name, subjectVal);

              subscriptionsMap.set(key, {
                id: `sub-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
                serviceName: parsedSender.name || parsedSender.domain,
                senderEmail: parsedSender.email,
                senderDomain: parsedSender.domain,
                latestDate: dateVal,
                messageCount: 1,
                sampleSubject: subjectVal,
                listUnsubscribeHeader: unsubHeader,
                listUnsubscribePost: unsubPostHeader,
                unsubscribeUrl: parsedUnsub.webUrl,
                unsubscribeMailto: parsedUnsub.mailtoRecipient,
                category,
                status: 'active',
                messageIds: [msg.id],
              });
            } else {
              const existing = subscriptionsMap.get(key)!;
              existing.messageCount += 1;
              if (!existing.messageIds.includes(msg.id)) {
                existing.messageIds.push(msg.id);
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to inspect message ${msg.id}`, err);
        } finally {
          scannedCount++;
          onProgress?.(scannedCount, subscriptionsMap.size, `Inspected ${scannedCount}/${messages.length} emails...`);
        }
      })
    );
  }

  return Array.from(subscriptionsMap.values()).sort((a, b) => b.messageCount - a.messageCount);
}

/**
 * Executes the unsubscribe action for a single subscription item
 */
export async function executeUnsubscribe(
  accessToken: string,
  item: SubscriptionItem,
  options: UnsubscribeConfirmationOptions
): Promise<{ success: boolean; method: string; emailsCleaned: number; error?: string }> {
  let method: string = 'Inbox Cleaned & Filtered';

  try {
    // 1. Send automated unsubscribe email if mailto exists
    if (options.sendUnsubscribeEmail && item.unsubscribeMailto) {
      try {
        const rawPayload = createUnsubscribeEmailPayload(
          item.unsubscribeMailto,
          'Unsubscribe',
          'Please unsubscribe this email address from your mailing list.'
        );

        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: rawPayload }),
        });

        if (sendRes.ok) {
          method = 'Mailto Unsubscribe';
        }
      } catch (e) {
        console.warn('Mailto send error:', e);
      }
    } else if (item.unsubscribeUrl && item.listUnsubscribePost?.toLowerCase().includes('one-click')) {
      method = 'RFC 8058 One-Click';
    } else if (item.unsubscribeUrl) {
      method = 'Direct Web Link';
    }

    // 2. Archive or Trash messages if requested
    let emailsCleaned = 0;
    if (item.messageIds && item.messageIds.length > 0) {
      if (options.archiveOrTrashEmails === 'archive') {
        const batchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: item.messageIds,
            removeLabelIds: ['INBOX', 'UNREAD'],
          }),
        });

        if (batchRes.ok) {
          emailsCleaned = item.messageIds.length;
        }
      } else if (options.archiveOrTrashEmails === 'trash') {
        const batchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: item.messageIds,
            addLabelIds: ['TRASH'],
            removeLabelIds: ['INBOX'],
          }),
        });

        if (batchRes.ok) {
          emailsCleaned = item.messageIds.length;
        }
      }
    }

    return {
      success: true,
      method,
      emailsCleaned: emailsCleaned || item.messageCount,
    };
  } catch (err: any) {
    return {
      success: false,
      method,
      emailsCleaned: 0,
      error: err?.message || 'Unsubscribe action failed',
    };
  }
}

/**
 * High-quality seed demo data to allow instant interactive exploration and testing
 */
export function getMockSubscriptions(): SubscriptionItem[] {
  return [
    {
      id: 'sub-substack-platformer',
      serviceName: 'Platformer News',
      senderEmail: 'casey@platformer.news',
      senderDomain: 'platformer.news',
      latestDate: 'Today, 7:15 AM',
      messageCount: 18,
      sampleSubject: 'The AI Bubble and Big Tech Earnings Review',
      listUnsubscribeHeader: '<mailto:unsub@platformer.news?subject=unsubscribe>, <https://platformer.news/unsubscribe>',
      listUnsubscribePost: 'List-Unsubscribe=One-Click',
      unsubscribeUrl: 'https://platformer.news/unsubscribe',
      unsubscribeMailto: 'unsub@platformer.news',
      category: 'newsletters',
      status: 'active',
      messageIds: ['m1', 'm2', 'm3', 'm4', 'm5'],
    },
    {
      id: 'sub-morning-brew',
      serviceName: 'Morning Brew',
      senderEmail: 'crew@morningbrew.com',
      senderDomain: 'morningbrew.com',
      latestDate: 'Yesterday, 6:00 AM',
      messageCount: 32,
      sampleSubject: '☕ Wall Street surges as inflation cools',
      listUnsubscribeHeader: '<mailto:unsubscribe@morningbrew.com>, <https://morningbrew.com/daily/unsubscribe>',
      listUnsubscribePost: 'List-Unsubscribe=One-Click',
      unsubscribeUrl: 'https://morningbrew.com/daily/unsubscribe',
      unsubscribeMailto: 'unsubscribe@morningbrew.com',
      category: 'newsletters',
      status: 'active',
      messageIds: ['m6', 'm7', 'm8'],
    },
    {
      id: 'sub-target-deals',
      serviceName: 'Target Circle',
      senderEmail: 'promotions@target.com',
      senderDomain: 'target.com',
      latestDate: 'Nov 10, 2026',
      messageCount: 24,
      sampleSubject: '🎯 25% off storewide: Exclusive weekend doorbusters',
      listUnsubscribeHeader: '<https://target.com/circle/email-opt-out>',
      unsubscribeUrl: 'https://target.com/circle/email-opt-out',
      category: 'ecommerce',
      status: 'active',
      messageIds: ['m9', 'm10'],
    },
    {
      id: 'sub-github-notifications',
      serviceName: 'GitHub Notifications',
      senderEmail: 'notifications@github.com',
      senderDomain: 'github.com',
      latestDate: 'Nov 9, 2026',
      messageCount: 45,
      sampleSubject: '[GitHub] Run failed: Build & Deploy workflow on main',
      listUnsubscribeHeader: '<mailto:unsub@github.com>, <https://github.com/notifications/unsubscribe>',
      unsubscribeUrl: 'https://github.com/notifications/unsubscribe',
      unsubscribeMailto: 'unsub@github.com',
      category: 'tech',
      status: 'active',
      messageIds: ['m11', 'm12', 'm13'],
    },
    {
      id: 'sub-sephora-beauty',
      serviceName: 'Sephora Beauty Insider',
      senderEmail: 'beauty@sephora.com',
      senderDomain: 'sephora.com',
      latestDate: 'Nov 8, 2026',
      messageCount: 14,
      sampleSubject: '💄 New arrivals + double points this week only',
      listUnsubscribeHeader: '<https://sephora.com/email-preferences>',
      unsubscribeUrl: 'https://sephora.com/email-preferences',
      category: 'ecommerce',
      status: 'active',
      messageIds: ['m14', 'm15'],
    },
    {
      id: 'sub-linkedin-updates',
      serviceName: 'LinkedIn Network',
      senderEmail: 'updates@linkedin.com',
      senderDomain: 'linkedin.com',
      latestDate: 'Nov 7, 2026',
      messageCount: 39,
      sampleSubject: 'Sarah Miller and 4 others viewed your profile',
      listUnsubscribeHeader: '<mailto:unsub@linkedin.com>, <https://linkedin.com/e/unsubscribe>',
      unsubscribeUrl: 'https://linkedin.com/e/unsubscribe',
      unsubscribeMailto: 'unsub@linkedin.com',
      category: 'social',
      status: 'active',
      messageIds: ['m16', 'm17'],
    },
    {
      id: 'sub-airbnb-trips',
      serviceName: 'Airbnb Travel',
      senderEmail: 'recommendations@airbnb.com',
      senderDomain: 'airbnb.com',
      latestDate: 'Nov 5, 2026',
      messageCount: 11,
      sampleSubject: 'Cabin getaways near you starting at $89/night',
      listUnsubscribeHeader: '<https://airbnb.com/users/unsubscribe>',
      unsubscribeUrl: 'https://airbnb.com/users/unsubscribe',
      category: 'travel',
      status: 'active',
      messageIds: ['m18'],
    },
    {
      id: 'sub-linear-app',
      serviceName: 'Linear Updates',
      senderEmail: 'announcements@linear.app',
      senderDomain: 'linear.app',
      latestDate: 'Nov 4, 2026',
      messageCount: 8,
      sampleSubject: 'Changelog: Customer requests, initiative roadmaps, and more',
      listUnsubscribeHeader: '<mailto:unsub@linear.app>',
      unsubscribeMailto: 'unsub@linear.app',
      category: 'tech',
      status: 'active',
      messageIds: ['m19'],
    },
    {
      id: 'sub-spotify-promos',
      serviceName: 'Spotify Releases',
      senderEmail: 'hello@spotify.com',
      senderDomain: 'spotify.com',
      latestDate: 'Nov 3, 2026',
      messageCount: 16,
      sampleSubject: 'New releases from artists you follow',
      listUnsubscribeHeader: '<https://spotify.com/account/unsubscribe>',
      unsubscribeUrl: 'https://spotify.com/account/unsubscribe',
      category: 'entertainment',
      status: 'active',
      messageIds: ['m20'],
    },
    {
      id: 'sub-chase-offers',
      serviceName: 'Chase Card Offers',
      senderEmail: 'creditcards@chase.com',
      senderDomain: 'chase.com',
      latestDate: 'Nov 1, 2026',
      messageCount: 7,
      sampleSubject: 'Earn 5% cash back in select categories this quarter',
      listUnsubscribeHeader: '<https://chase.com/optout>',
      unsubscribeUrl: 'https://chase.com/optout',
      category: 'finance',
      status: 'active',
      messageIds: ['m21'],
    },
  ];
}
