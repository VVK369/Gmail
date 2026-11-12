import { SubscriptionCategory, CategoryMeta } from '../types/subscription';

export const CATEGORIES_META: Record<SubscriptionCategory, CategoryMeta> = {
  newsletters: {
    id: 'newsletters',
    label: 'Newsletters & Media',
    description: 'Daily digests, editorial writing, news blogs, and publication letters',
    color: '#3b82f6', // blue
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconName: 'Newspaper',
  },
  ecommerce: {
    id: 'ecommerce',
    label: 'E-Commerce & Retail',
    description: 'Shopping promotions, flash sales, order updates, and product discounts',
    color: '#ec4899', // pink
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700',
    badgeBorder: 'border-pink-200',
    iconName: 'ShoppingBag',
  },
  tech: {
    id: 'tech',
    label: 'Tech & SaaS',
    description: 'Software updates, developer tools, cloud alerts, and platform notifications',
    color: '#8b5cf6', // purple
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconName: 'Cpu',
  },
  finance: {
    id: 'finance',
    label: 'Finance & Banking',
    description: 'Crypto, investments, fintech, bank alerts, and accounting reports',
    color: '#10b981', // emerald
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconName: 'TrendingUp',
  },
  social: {
    id: 'social',
    label: 'Social & Community',
    description: 'Social networks, discussion forums, community groups, and meetups',
    color: '#f59e0b', // amber
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    iconName: 'Users',
  },
  travel: {
    id: 'travel',
    label: 'Travel & Hospitality',
    description: 'Airlines, hotel bookings, ride hailing, and vacation rentals',
    color: '#06b6d4', // cyan
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    iconName: 'Plane',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment & Gaming',
    description: 'Streaming services, video games, events, music, and ticketing',
    color: '#6366f1', // indigo
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    iconName: 'Film',
  },
  other: {
    id: 'other',
    label: 'General & Other',
    description: 'Uncategorized or miscellaneous automated subscriptions',
    color: '#64748b', // slate
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    iconName: 'Tag',
  },
};

export const ALL_CATEGORIES = Object.keys(CATEGORIES_META) as SubscriptionCategory[];

/**
 * Heuristic auto-categorization based on domain, service name, and email subjects
 */
export function detectCategory(
  senderEmail: string,
  serviceName: string = '',
  sampleSubject: string = ''
): SubscriptionCategory {
  const text = `${senderEmail} ${serviceName} ${sampleSubject}`.toLowerCase();
  const domain = senderEmail.split('@')[1]?.toLowerCase() || '';

  // 1. Tech & SaaS
  if (
    /github|gitlab|bitbucket|linear|slack|jira|atlassian|docker|aws|amazon web services|vercel|netlify|supabase|datadog|sentry|digitalocean|cloudflare|openai|anthropic|stripe|postman|heroku|twilio|notion|figma|loom|zoom|miro|airtable|hubspot|zapier|cursor|copilot/i.test(
      text
    ) ||
    /devops|api|cloud|deploy|saas|developer|release notes/i.test(text)
  ) {
    return 'tech';
  }

  // 2. Newsletters & Media
  if (
    /substack|medium|morning brew|the verge|techcrunch|wirecutter|axios|nytimes|new york times|bloomberg|wsj|washington post|the athletic|hackernews|tldr|the hustle|dense discovery|hacker newsletter|the skimm|the information|semafor/i.test(
      text
    ) ||
    /newsletter|digest|weekly|daily brief|edition|roundup|issue #|dispatch|curated/i.test(text)
  ) {
    return 'newsletters';
  }

  // 3. E-commerce & Retail
  if (
    /amazon\.com|ebay|shopify|etsy|target|walmart|aliexpress|best buy|costco|nike|adidas|zara|h&m|sephora|ulta|asos|wayfair|ikea|chewy|nordstrom/i.test(
      text
    ) ||
    /sale|discount|coupon|promo code|% off|free shipping|deal of the day|clearance|order confirmation|cart reminder|buy now|shop now/i.test(
      text
    )
  ) {
    return 'ecommerce';
  }

  // 4. Finance & Banking
  if (
    /chase|bank of america|wells fargo|citi|capital one|robinhood|fidelity|vanguard|charles schwab|coinbase|binance|kraken|paypal|venmo|cash app|revolut|wise|mint|ynab|credit karma|intuit|turbotax/i.test(
      text
    ) ||
    /statement|portfolio|dividend|stock alert|crypto|banking|wire transfer|mortgage|credit score|interest rate/i.test(
      text
    )
  ) {
    return 'finance';
  }

  // 5. Social & Community
  if (
    /linkedin|twitter|x\.com|facebook|instagram|threads|reddit|discord|quora|meetup|tiktok|pinterest|discourse|clubhouse|nextdoor/i.test(
      text
    ) ||
    /connection request|new follower|mentioned you|replied to your|community digest|new post from/i.test(text)
  ) {
    return 'social';
  }

  // 6. Travel & Hospitality
  if (
    /airbnb|booking\.com|expedia|kayak|tripadvisor|uber|lyft|delta|united airlines|american airlines|southwest|air france|lufthansa|marriott|hilton|hyatt|hostelworld/i.test(
      text
    ) ||
    /flight|boarding pass|hotel reservation|itinerary|car rental|miles balance/i.test(text)
  ) {
    return 'travel';
  }

  // 7. Entertainment & Gaming
  if (
    /netflix|spotify|disney\+|hulu|hbo|max|prime video|youtube|apple music|steam|playstation|xbox|nintendo|epic games|twitch|eventbrite|ticketmaster/i.test(
      text
    ) ||
    /streaming|now watching|concert tickets|game pass|new playlist/i.test(text)
  ) {
    return 'entertainment';
  }

  return 'other';
}

const CATEGORY_STORAGE_KEY = 'unsubify_user_category_preferences';

/**
 * Loads stored user category overrides from localStorage
 */
export function getSavedCategoryOverrides(): Record<string, SubscriptionCategory> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to load category preferences from storage:', err);
    return {};
  }
}

/**
 * Saves a category override for a sender domain or email address
 */
export function saveCategoryOverride(senderKey: string, category: SubscriptionCategory): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedCategoryOverrides();
    current[senderKey.toLowerCase()] = category;
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save category preference:', err);
  }
}

/**
 * Batch saves category overrides
 */
export function saveMultipleCategoryOverrides(overrides: Record<string, SubscriptionCategory>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedCategoryOverrides();
    for (const [key, category] of Object.entries(overrides)) {
      current[key.toLowerCase()] = category;
    }
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save multiple category preferences:', err);
  }
}
