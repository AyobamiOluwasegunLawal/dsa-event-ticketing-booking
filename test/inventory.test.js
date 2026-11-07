import assert from 'node:assert/strict';
import test from 'node:test';
import { DomainError } from '../src/domain/errors.js';
import {
  addTier,
  bookTickets,
  cancelBooking,
  createEvent,
  createStore,
  listEventSummaries,
  publishEvent,
  unpublishEvent,
} from '../src/domain/inventory.js';
import { createPublishedEvent } from '../support/helpers.js';

function assertDomainError(action, code) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    return true;
  });
}

test('S02 creates a new draft event with title, city, venue and a valid date', () => {
  const store = createStore();
  const event = createEvent(store, {
    title: 'Lagos Tech Meetup',
    city: 'Lagos',
    venue: 'Civic Centre',
    date: '2026-12-05T17:00:00Z',
  });

  assert.ok(event.id);
  assert.equal(event.title, 'Lagos Tech Meetup');
  assert.equal(event.city, 'Lagos');
  assert.equal(event.venue, 'Civic Centre');
  assert.equal(event.date, '2026-12-05T17:00:00Z');
  assert.equal(event.published, false);
  assert.equal(listEventSummaries(store).length, 0);
});

test('S02 rejects missing title or city and invalid calendar dates without saving', () => {
  const store = createStore();
  const valid = {
    title: 'Valid event',
    city: 'Lagos',
    venue: 'Civic Centre',
    date: '2026-12-05',
  };

  for (const input of [
    { ...valid, title: '' },
    { ...valid, title: undefined },
    { ...valid, city: '' },
    { ...valid, city: undefined },
    { ...valid, venue: '' },
    { ...valid, date: '2026-02-30' },
    { ...valid, date: 'not-a-date' },
  ]) {
    assertDomainError(() => createEvent(store, input), 'VALIDATION');
  }
  assert.equal(store.events.size, 0);
});

test('S03 adds a tier with its full capacity available and none sold', () => {
  const store = createStore();
  const event = createEvent(store, {
    title: 'Tier event',
    city: 'Lagos',
    venue: 'Hall',
    date: '2026-12-05',
  });
  const tier = addTier(store, event.id, {
    name: 'General',
    priceCents: 500000,
    capacity: 100,
  });

  assert.equal(tier.sold, 0);
  assert.equal(tier.available, 100);
});

test('S03 rejects fractional prices and capacities below one', () => {
  const store = createStore();
  const event = createEvent(store, {
    title: 'Tier event',
    city: 'Lagos',
    venue: 'Hall',
    date: '2026-12-05',
  });
  for (const input of [
    { name: 'Fractional price', priceCents: 1.5, capacity: 1 },
    { name: 'Zero capacity', priceCents: 100, capacity: 0 },
    { name: 'Negative capacity', priceCents: 100, capacity: -1 },
  ]) {
    assertDomainError(() => addTier(store, event.id, input), 'VALIDATION');
  }
  assert.equal(store.tiers.size, 0);
});

test('S03 rejects adding a tier to a missing event', () => {
  const store = createStore();
  assertDomainError(
    () => addTier(store, 'missing-event', { name: 'General', priceCents: 500, capacity: 1 }),
    'NOT_FOUND',
  );
});

test('S04 publishes a tiered draft and exposes it in the public list', () => {
  const { store, event } = createPublishedEvent();
  assert.equal(event.published, true);
  assert.equal(listEventSummaries(store).length, 1);
});

test('S04 rejects publishing an event without tiers and leaves it a hidden draft', () => {
  const store = createStore();
  const event = createEvent(store, {
    title: 'No tier event',
    city: 'Lagos',
    venue: 'Hall',
    date: '2026-12-05',
  });

  assertDomainError(() => publishEvent(store, event.id), 'INVALID_STATE');
  assert.equal(event.published, false);
  assert.deepEqual(listEventSummaries(store), []);
});

test('S04 unpublishes a public event and keeps it in the full list', () => {
  const { store, event } = createPublishedEvent();
  unpublishEvent(store, event.id);

  assert.equal(event.published, false);
  assert.deepEqual(listEventSummaries(store), []);
  assert.equal(listEventSummaries(store, { publishedOnly: false }).length, 1);
});

test('public event listing validates the publishedOnly option', () => {
  const { store } = createPublishedEvent();
  assertDomainError(() => listEventSummaries(store, { publishedOnly: 'yes' }), 'VALIDATION');
});

test('S06 creates a pending booking for the requested quantity and cents total', () => {
  const { store, event, tier } = createPublishedEvent({ capacity: 3, priceCents: 500 });
  const booking = bookTickets(store, {
    eventId: event.id,
    tierId: tier.id,
    attendeeName: 'Ada',
    quantity: 2,
  });

  assert.equal(booking.status, 'PENDING');
  assert.equal(booking.quantity, 2);
  assert.equal(booking.totalCents, 1000);
  assert.equal(tier.sold, 2);
  assert.equal(tier.available, 1);
});

test('S06 rejects a sold-out booking without changing inventory or bookings', () => {
  const { store, event, tier } = createPublishedEvent({ capacity: 1 });
  const before = {
    sold: tier.sold,
    available: tier.available,
    bookings: store.bookings.length,
    references: store.bookingsByReference.size,
  };

  assertDomainError(
    () => bookTickets(store, {
      eventId: event.id,
      tierId: tier.id,
      attendeeName: 'Bayo',
      quantity: 2,
    }),
    'SOLD_OUT',
  );
  assert.deepEqual({
    sold: tier.sold,
    available: tier.available,
    bookings: store.bookings.length,
    references: store.bookingsByReference.size,
  }, before);
});

test('S06 rejects zero, negative, fractional and greater-than-ten quantities', () => {
  const { store, event, tier } = createPublishedEvent({ capacity: 20 });
  for (const quantity of [0, -1, 1.5, 11]) {
    assertDomainError(
      () => bookTickets(store, {
        eventId: event.id,
        tierId: tier.id,
        attendeeName: 'Invalid quantity',
        quantity,
      }),
      'VALIDATION',
    );
  }
  assert.equal(tier.available, 20);
  assert.equal(store.bookings.length, 0);
});

test('cancelling releases seats once and rejects a repeated cancellation', () => {
  const { store, event, tier } = createPublishedEvent({ capacity: 2 });
  const booking = bookTickets(store, {
    eventId: event.id,
    tierId: tier.id,
    attendeeName: 'Ada',
    quantity: 2,
  });
  cancelBooking(store, booking.reference);

  assert.equal(tier.sold, 0);
  assert.equal(tier.available, 2);
  assertDomainError(() => cancelBooking(store, booking.reference), 'ALREADY_CANCELLED');
  assert.equal(tier.available, 2);
});
