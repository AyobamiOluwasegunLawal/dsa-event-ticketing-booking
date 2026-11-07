import { DomainError } from './errors.js';
import { newId, newReference } from './ids.js';
import { Queue } from './waitlistQueue.js';

const stores = new WeakSet();

function fail(code, message) {
  throw new DomainError(code, message);
}

function requireStore(store) {
  if (!store || !stores.has(store)) {
    fail('VALIDATION', 'A store created by createStore() is required.');
  }
}

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('VALIDATION', `${label} must be an object.`);
  }
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail('VALIDATION', `${label} must be a non-empty string.`);
  }

  return value.trim();
}

function requirePositiveInteger(value, label, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    fail('VALIDATION', `${label} must be a whole number between 1 and ${maximum}.`);
  }
}

function getEvent(store, eventId) {
  if (typeof eventId !== 'string' || eventId.length === 0) {
    fail('VALIDATION', 'eventId must be a non-empty string.');
  }

  const event = store.events.get(eventId);
  if (!event) {
    fail('NOT_FOUND', `Event ${eventId} was not found.`);
  }

  return event;
}

function getTier(store, event, tierId) {
  if (typeof tierId !== 'string' || tierId.length === 0) {
    fail('VALIDATION', 'tierId must be a non-empty string.');
  }

  const tier = store.tiers.get(tierId);
  if (!tier || tier.eventId !== event.id) {
    fail('NOT_FOUND', `Ticket tier ${tierId} was not found for this event.`);
  }

  return tier;
}

export function createStore() {
  const store = {
    events: new Map(),
    tiers: new Map(),
    bookings: [],
    bookingsByReference: new Map(),
    waitlists: new Map(),
  };
  stores.add(store);
  return store;
}

export function createEvent(store, input) {
  requireStore(store);
  requireObject(input, 'Event');
  const name = requireText(input.name, 'Event name');
  const event = { id: newId(), name, tierIds: [] };
  store.events.set(event.id, event);
  return event;
}

export function addTier(store, eventId, input) {
  requireStore(store);
  const event = getEvent(store, eventId);
  requireObject(input, 'Ticket tier');

  const name = requireText(input.name, 'Ticket tier name');
  requirePositiveInteger(input.capacity, 'Capacity');
  if (!Number.isSafeInteger(input.priceCents) || input.priceCents < 0) {
    fail('VALIDATION', 'priceCents must be a non-negative whole number of cents.');
  }

  const tier = {
    id: newId(),
    eventId: event.id,
    name,
    capacity: input.capacity,
    available: input.capacity,
    priceCents: input.priceCents,
  };
  store.tiers.set(tier.id, tier);
  event.tierIds.push(tier.id);
  return tier;
}

export function bookTickets(store, input) {
  requireStore(store);
  requireObject(input, 'Booking');
  const event = getEvent(store, input.eventId);
  const tier = getTier(store, event, input.tierId);
  const attendeeName = requireText(input.attendeeName, 'Attendee name');
  requirePositiveInteger(input.quantity, 'Ticket quantity', 10);

  if (tier.available < input.quantity) {
    fail('SOLD_OUT', `Only ${tier.available} tickets remain in the ${tier.name} tier.`);
  }

  const totalCents = tier.priceCents * input.quantity;
  if (!Number.isSafeInteger(totalCents)) {
    fail('VALIDATION', 'Booking total must be a safe whole number of cents.');
  }

  let reference;
  do {
    reference = newReference();
  } while (store.bookingsByReference.has(reference));

  const booking = {
    id: newId(),
    reference,
    eventId: event.id,
    tierId: tier.id,
    attendeeName,
    quantity: input.quantity,
    totalCents,
    status: 'CONFIRMED',
  };

  tier.available -= input.quantity;
  store.bookings.push(booking);
  store.bookingsByReference.set(reference, booking);
  return booking;
}

export function cancelBooking(store, reference) {
  requireStore(store);
  if (typeof reference !== 'string' || reference.trim().length === 0) {
    fail('VALIDATION', 'Booking reference must be a non-empty string.');
  }

  const booking = store.bookingsByReference.get(reference);
  if (!booking) {
    fail('NOT_FOUND', `Booking ${reference} was not found.`);
  }
  if (booking.status === 'CANCELLED') {
    fail('ALREADY_CANCELLED', `Booking ${reference} has already been cancelled.`);
  }

  const tier = store.tiers.get(booking.tierId);
  tier.available += booking.quantity;
  booking.status = 'CANCELLED';
  return booking;
}

export function findBookingByReference(store, reference) {
  requireStore(store);
  if (typeof reference !== 'string' || reference.trim().length === 0) {
    fail('VALIDATION', 'Booking reference must be a non-empty string.');
  }

  const booking = store.bookingsByReference.get(reference);
  if (!booking) {
    fail('NOT_FOUND', `Booking ${reference} was not found.`);
  }
  return booking;
}

export function joinWaitlist(store, input) {
  requireStore(store);
  requireObject(input, 'Waitlist entry');
  const event = getEvent(store, input.eventId);
  const tier = getTier(store, event, input.tierId);
  const attendeeName = requireText(input.attendeeName, 'Attendee name');
  const quantity = input.quantity === undefined ? 1 : input.quantity;
  requirePositiveInteger(quantity, 'Ticket quantity', 10);

  let queue = store.waitlists.get(tier.id);
  if (!queue) {
    queue = new Queue();
    store.waitlists.set(tier.id, queue);
  }

  const entry = {
    id: newId(),
    eventId: event.id,
    tierId: tier.id,
    attendeeName,
    quantity,
  };
  queue.enqueue(entry);
  return entry;
}
