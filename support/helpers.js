import { addTier, createEvent, createStore, publishEvent } from '../src/domain/inventory.js';

export function createPublishedEvent({
  title = 'Lagos Tech Meetup',
  city = 'Lagos',
  venue = 'Civic Centre',
  date = '2026-12-05T17:00:00Z',
  capacity = 3,
  priceCents = 5000,
} = {}) {
  const store = createStore();
  const event = createEvent(store, { title, city, venue, date });
  const tier = addTier(store, event.id, {
    name: 'General',
    capacity,
    priceCents,
  });
  publishEvent(store, event.id);
  return { store, event, tier };
}

export function makeSummary({
  id,
  title,
  city = 'Lagos',
  venue = 'Civic Centre',
  date = '2026-12-05T17:00:00Z',
  prices = [5000],
  available = [3],
} = {}) {
  return {
    id,
    title,
    city,
    venue,
    date,
    tiers: prices.map((priceCents, index) => ({
      id: `${id}-tier-${index}`,
      priceCents,
      available: available[index] ?? 0,
    })),
  };
}
