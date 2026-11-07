import assert from 'node:assert/strict';
import test from 'node:test';
import { DomainError } from '../src/domain/errors.js';
import { filterEvents, searchEvents, sortEvents } from '../src/domain/eventSearch.js';
import { mergeSort } from '../src/domain/sorting.js';
import { makeSummary } from '../support/helpers.js';

function assertValidation(action) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, 'VALIDATION');
    return true;
  });
}

const jazz = makeSummary({
  id: 'jazz',
  title: 'Abuja Jazz Night',
  city: 'Abuja',
  venue: 'Arts Centre',
  prices: [2500],
});
const meetup = makeSummary({
  id: 'meetup',
  title: 'Lagos Tech Meetup',
  city: 'Lagos',
  venue: 'Civic Centre',
  prices: [5000],
});

test('S05 searches event titles case-insensitively', () => {
  assert.deepEqual(filterEvents([meetup, jazz], { q: 'JAZZ' }), [jazz]);
});

test('S05 searches venue names case-insensitively', () => {
  assert.deepEqual(filterEvents([meetup, jazz], { q: 'CIVIC' }), [meetup]);
});

test('S05 filters city exactly apart from letter case', () => {
  assert.deepEqual(filterEvents([meetup, jazz], { city: 'lagos' }), [meetup]);
});

test('S05 applies the cheapest-tier price ceiling and leaves unpriced events out', () => {
  const multiTier = makeSummary({
    id: 'multi',
    title: 'Multi tier',
    prices: [8000, 3000],
  });
  const noTiers = makeSummary({ id: 'free-tierless', title: 'No tiers', prices: [] });
  const result = searchEvents([meetup, jazz, multiTier, noTiers], { maxPriceCents: 3000 }, 'price');

  assert.deepEqual(result, [jazz, multiTier]);
});

test('S05 sorts same-day events by title after their date ties', () => {
  const zulu = makeSummary({ id: 'zulu', title: 'Zulu', date: '2026-12-05' });
  const alpha = makeSummary({ id: 'alpha', title: 'Alpha', date: '2026-12-05' });

  assert.deepEqual(sortEvents([zulu, alpha], 'date'), [alpha, zulu]);
});

test('S05 includes the whole date when the upper bound is date-only', () => {
  const evening = makeSummary({ id: 'evening', title: 'Evening', date: '2026-12-05T17:00:00Z' });
  assert.deepEqual(filterEvents([evening], { to: '2026-12-05' }), [evening]);
});

test('S05 validates bad dates, non-whole-cent prices and unknown sort options', () => {
  assertValidation(() => filterEvents([meetup], { from: '2026-02-30' }));
  assertValidation(() => filterEvents([meetup], { maxPriceCents: 1.25 }));
  assertValidation(() => sortEvents([meetup], 'popularity'));
});

test('S05 filtering and sorting return new lists without changing the input list', () => {
  const input = [meetup, jazz];
  const before = input.slice();
  const filtered = filterEvents(input, { city: 'lagos' });
  const sorted = sortEvents(input, 'price');

  assert.notEqual(filtered, input);
  assert.notEqual(sorted, input);
  assert.deepEqual(input, before);
});

test('mergeSort is stable and leaves its input unchanged', () => {
  const input = [
    { key: 2, order: 'first-two' },
    { key: 1, order: 'one' },
    { key: 2, order: 'second-two' },
  ];
  const before = input.slice();
  const sorted = mergeSort(input, (left, right) => left.key - right.key);

  assert.deepEqual(sorted.map(({ order }) => order), ['one', 'first-two', 'second-two']);
  assert.deepEqual(input, before);
  assert.notEqual(sorted, input);
});

test('mergeSort validates its arguments with a domain error', () => {
  assertValidation(() => mergeSort('not-an-array', (left, right) => left - right));
  assertValidation(() => mergeSort([], null));
});

test('sortEvents applies price, availability, title and id ordering including no-price events last', () => {
  const noPrice = makeSummary({ id: '0', title: 'A no-price event', prices: [] });
  const expensive = makeSummary({ id: '2', title: 'B event', prices: [4000] });
  const cheap = makeSummary({ id: '1', title: 'A event', prices: [1000] });
  const mostAvailable = makeSummary({ id: '3', title: 'Z event', prices: [1000], available: [5] });
  const fewerAvailable = makeSummary({ id: '4', title: 'Y event', prices: [1000], available: [2] });

  assert.deepEqual(sortEvents([noPrice, expensive, cheap], 'price'), [cheap, expensive, noPrice]);
  assert.deepEqual(
    sortEvents([fewerAvailable, mostAvailable], 'availability'),
    [mostAvailable, fewerAvailable],
  );
  assert.deepEqual(
    sortEvents([makeSummary({ id: 'b', title: 'Same' }), makeSummary({ id: 'a', title: 'Same' })], 'date')
      .map((item) => item.id),
    ['a', 'b'],
  );
});

test('searchEvents returns an empty list for empty input and filters then sorts', () => {
  assert.deepEqual(searchEvents([], {}, 'date'), []);
  assert.deepEqual(searchEvents([meetup, jazz], { q: 'jazz' }, 'price'), [jazz]);
});

test('onlyAvailable removes events without seats and accepts false as no availability filter', () => {
  const soldOut = makeSummary({ id: 'sold', title: 'Sold out', available: [0] });
  assert.deepEqual(filterEvents([soldOut, meetup], { onlyAvailable: true }), [meetup]);
  assert.deepEqual(filterEvents([soldOut], { onlyAvailable: false }), [soldOut]);
});
