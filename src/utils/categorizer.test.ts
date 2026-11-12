import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCategory, CATEGORIES_META } from './categorizer';

test('detects tech category correctly', () => {
  assert.equal(detectCategory('notifications@github.com', 'GitHub', '[GitHub] Security Alert'), 'tech');
  assert.equal(detectCategory('billing@aws.amazon.com', 'AWS Cloud', 'AWS Monthly Statement'), 'tech');
  assert.equal(detectCategory('team@vercel.com', 'Vercel', 'Your deployment is ready'), 'tech');
});

test('detects newsletter category correctly', () => {
  assert.equal(detectCategory('digest@substack.com', 'Platformer', 'The Day in Tech Newsletter'), 'newsletters');
  assert.equal(detectCategory('crew@morningbrew.com', 'Morning Brew', 'Your daily financial morning brew'), 'newsletters');
  assert.equal(detectCategory('newsletters@nytimes.com', 'The New York Times', 'The Morning: Global Update'), 'newsletters');
});

test('detects ecommerce category correctly', () => {
  assert.equal(detectCategory('promo@target.com', 'Target Deals', 'Save 20% off with coupon code today!'), 'ecommerce');
  assert.equal(detectCategory('auto-confirm@amazon.com', 'Amazon Deals', 'Flash Sale: 50% discount on electronics'), 'ecommerce');
});

test('detects finance category correctly', () => {
  assert.equal(detectCategory('alerts@chase.com', 'Chase Bank', 'Your monthly checking account statement'), 'finance');
  assert.equal(detectCategory('service@paypal.com', 'PayPal', 'You received a payment transaction'), 'finance');
});

test('detects social category correctly', () => {
  assert.equal(detectCategory('messages-noreply@linkedin.com', 'LinkedIn', 'John Doe mentioned you in a post'), 'social');
  assert.equal(detectCategory('noreply@redditmail.com', 'Reddit', 'Trending in r/programming today'), 'social');
});

test('detects travel category correctly', () => {
  assert.equal(detectCategory('automated@airbnb.com', 'Airbnb', 'Your reservation confirmation for Kyoto'), 'travel');
  assert.equal(detectCategory('reservations@delta.com', 'Delta Air Lines', 'Your flight itinerary and boarding pass'), 'travel');
});

test('falls back to other category when ambiguous', () => {
  assert.equal(detectCategory('contact@randomdomain12345.org', 'Random Domain', 'Hello friend'), 'other');
});

test('all categories have valid metadata', () => {
  const ids = Object.keys(CATEGORIES_META);
  assert.ok(ids.length >= 8);
  for (const id of ids) {
    const meta = (CATEGORIES_META as any)[id];
    assert.ok(meta.label);
    assert.ok(meta.color);
    assert.ok(meta.badgeBg);
  }
});
