import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSender, parseListUnsubscribe, createUnsubscribeEmailPayload } from './emailParser';

test('parses full RFC 822 sender header with name and email', () => {
  const result = parseSender('"Morning Brew" <crew@morningbrew.com>');
  assert.equal(result.name, 'Morning Brew');
  assert.equal(result.email, 'crew@morningbrew.com');
  assert.equal(result.domain, 'morningbrew.com');
});

test('parses unquoted sender header', () => {
  const result = parseSender('GitHub Notifications <notifications@github.com>');
  assert.equal(result.name, 'GitHub Notifications');
  assert.equal(result.email, 'notifications@github.com');
  assert.equal(result.domain, 'github.com');
});

test('parses email-only sender header', () => {
  const result = parseSender('newsletters@substack.com');
  assert.equal(result.email, 'newsletters@substack.com');
  assert.equal(result.domain, 'substack.com');
  assert.equal(result.name, 'Substack');
});

test('parses RFC 2369 List-Unsubscribe header with mailto and http links', () => {
  const header = '<mailto:unsubscribe@example.com?subject=unsub123>, <https://example.com/unsub?token=abc>';
  const parsed = parseListUnsubscribe(header, 'List-Unsubscribe=One-Click');

  assert.equal(parsed.mailtoRecipient, 'unsubscribe@example.com');
  assert.equal(parsed.mailtoSubject, 'unsub123');
  assert.equal(parsed.webUrl, 'https://example.com/unsub?token=abc');
  assert.equal(parsed.isOneClickPostSupported, true);
});

test('parses RFC 2369 header with only mailto', () => {
  const header = '<mailto:optout@service.org>';
  const parsed = parseListUnsubscribe(header);

  assert.equal(parsed.mailtoRecipient, 'optout@service.org');
  assert.equal(parsed.mailtoSubject, 'Unsubscribe');
  assert.equal(parsed.webUrl, undefined);
  assert.equal(parsed.isOneClickPostSupported, false);
});

test('parses RFC 2369 header with only web URL', () => {
  const header = '<https://notifications.google.com/unsubscribe/xyz>';
  const parsed = parseListUnsubscribe(header);

  assert.equal(parsed.mailtoRecipient, undefined);
  assert.equal(parsed.webUrl, 'https://notifications.google.com/unsubscribe/xyz');
});

test('creates valid base64url encoded RFC 2822 payload for Gmail send API', () => {
  const payload = createUnsubscribeEmailPayload('unsub@example.com', 'Unsubscribe Request', 'Please remove me');
  assert.ok(typeof payload === 'string');
  assert.ok(payload.length > 10);
  // base64url should not have +, /, or =
  assert.ok(!payload.includes('+'));
  assert.ok(!payload.includes('/'));
  assert.ok(!payload.includes('='));
});
