export interface ParsedSender {
  name: string;
  email: string;
  domain: string;
}

export interface ParsedUnsubscribeHeader {
  mailtoUri?: string;
  mailtoRecipient?: string;
  mailtoSubject?: string;
  mailtoBody?: string;
  webUrl?: string;
  isOneClickPostSupported: boolean;
}

/**
 * Parses a standard RFC 822 From header like:
 * "Morning Brew <crew@morningbrew.com>" or "crew@morningbrew.com"
 */
export function parseSender(fromHeader: string): ParsedSender {
  if (!fromHeader) {
    return { name: 'Unknown Sender', email: 'unknown@example.com', domain: 'example.com' };
  }

  const match = fromHeader.match(/^(?:(?:"?([^"<]*)"?\s*)?<)?([^>]+)>?$/);
  if (match) {
    let name = (match[1] || '').trim();
    let email = (match[2] || '').trim();

    // Clean surrounding quotes
    name = name.replace(/^["']|["']$/g, '').trim();

    const atIndex = email.indexOf('@');
    const domain = atIndex > -1 ? email.substring(atIndex + 1).toLowerCase() : '';

    if (!name) {
      // Derive name from domain if name was empty
      name = domain ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) : email;
    }

    return { name, email, domain };
  }

  return {
    name: fromHeader.trim(),
    email: fromHeader.trim(),
    domain: fromHeader.includes('@') ? fromHeader.split('@')[1].trim().toLowerCase() : '',
  };
}

/**
 * Parses RFC 2369 & RFC 8058 List-Unsubscribe and List-Unsubscribe-Post headers
 */
export function parseListUnsubscribe(
  listUnsubscribeHeader?: string,
  listUnsubscribePostHeader?: string
): ParsedUnsubscribeHeader {
  const result: ParsedUnsubscribeHeader = {
    isOneClickPostSupported: (listUnsubscribePostHeader || '').toLowerCase().includes('one-click'),
  };

  if (!listUnsubscribeHeader) return result;

  // Header can contain multiple items inside angle brackets: <mailto:...>, <https://...>
  const bracketMatches = listUnsubscribeHeader.match(/<([^>]+)>/g) || [];

  for (const item of bracketMatches) {
    const raw = item.replace(/^<|>$/g, '').trim();
    if (raw.toLowerCase().startsWith('mailto:')) {
      result.mailtoUri = raw;
      try {
        const withoutPrefix = raw.slice(7);
        const [recipient, queryString] = withoutPrefix.split('?');
        result.mailtoRecipient = decodeURIComponent(recipient || '').trim();

        if (queryString) {
          const params = new URLSearchParams(queryString);
          result.mailtoSubject = params.get('subject') || 'Unsubscribe';
          result.mailtoBody = params.get('body') || 'Unsubscribe';
        } else {
          result.mailtoSubject = 'Unsubscribe';
          result.mailtoBody = 'Unsubscribe';
        }
      } catch {
        result.mailtoRecipient = raw.slice(7);
        result.mailtoSubject = 'Unsubscribe';
      }
    } else if (raw.toLowerCase().startsWith('http://') || raw.toLowerCase().startsWith('https://')) {
      if (!result.webUrl) {
        result.webUrl = raw;
      }
    }
  }

  return result;
}

/**
 * Encodes an RFC 2822 email message in base64url format for the Gmail API `users/me/messages/send`
 */
export function createUnsubscribeEmailPayload(
  to: string,
  subject: string = 'Unsubscribe',
  body: string = 'Please unsubscribe me from this mailing list.\r\n'
): string {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: Unsubify-Gmail-Client',
    '',
    body,
  ];

  const rawEmail = emailLines.join('\r\n');

  // Convert to base64url (replace + with -, / with _, remove padding =)
  const utf8Bytes = new TextEncoder().encode(rawEmail);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
