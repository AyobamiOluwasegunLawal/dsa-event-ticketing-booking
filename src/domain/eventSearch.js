import { DomainError } from './errors.js';
import { parseISODate } from './dates.js';
import { mergeSort } from './sorting.js';

function fail(message) {
  throw new DomainError('VALIDATION', message);
}

function requireSummaries(summaries) {
  if (!Array.isArray(summaries)) {
    fail('Event summaries must be an array.');
  }
  if (summaries.some((summary) => summary === null || typeof summary !== 'object' || Array.isArray(summary))) {
    fail('Each event summary must be an object.');
  }
}

function requireCriteria(criteria) {
  if (criteria === undefined) {
    return {};
  }
  if (criteria === null || typeof criteria !== 'object' || Array.isArray(criteria)) {
    fail('Search criteria must be an object.');
  }
  return criteria;
}

function tiersOf(summary) {
  if (!Array.isArray(summary.tiers)) {
    return [];
  }
  return summary.tiers;
}

function cheapestPrice(summary) {
  const tiers = tiersOf(summary);
  if (tiers.length === 0) {
    return null;
  }

  let cheapest = Infinity;
  for (const tier of tiers) {
    if (Number.isSafeInteger(tier?.priceCents) && tier.priceCents >= 0) {
      cheapest = Math.min(cheapest, tier.priceCents);
    }
  }
  return Number.isFinite(cheapest) ? cheapest : null;
}

function availableSeats(summary) {
  return tiersOf(summary).reduce(
    (total, tier) => total + (Number.isSafeInteger(tier?.available) ? tier.available : 0),
    0,
  );
}

function validatePrice(price) {
  if (!Number.isSafeInteger(price) || price < 0) {
    fail('maxPriceCents must be a non-negative whole number of cents.');
  }
}

function validateOptionalText(value, label) {
  if (value !== undefined && typeof value !== 'string') {
    fail(`${label} must be a string.`);
  }
}

export function filterEvents(summaries, criteria = {}) {
  requireSummaries(summaries);
  const options = requireCriteria(criteria);
  validateOptionalText(options.q, 'q');
  validateOptionalText(options.city, 'city');

  const from = options.from === undefined
    ? undefined
    : parseISODate(options.from, { label: 'from' });
  const to = options.to === undefined
    ? undefined
    : parseISODate(options.to, { label: 'to', endOfDay: true });

  if (from !== undefined && to !== undefined && from > to) {
    fail('from must be on or before to.');
  }
  if (options.maxPriceCents !== undefined) {
    validatePrice(options.maxPriceCents);
  }
  if (options.onlyAvailable !== undefined && typeof options.onlyAvailable !== 'boolean') {
    fail('onlyAvailable must be a boolean.');
  }

  const query = options.q?.toLowerCase();
  const city = options.city?.toLowerCase();

  return summaries.filter((summary) => {
    if (query) {
      const title = typeof summary.title === 'string' ? summary.title : '';
      const venue = typeof summary.venue === 'string' ? summary.venue : '';
      if (
        !title.toLowerCase().includes(query) &&
        !venue.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    if (city) {
      const eventCity = typeof summary.city === 'string' ? summary.city : '';
      if (eventCity.toLowerCase() !== city) {
        return false;
      }
    }

    if (from !== undefined || to !== undefined) {
      const eventDate = parseISODate(summary.date, { label: 'Event date' });
      if ((from !== undefined && eventDate < from) || (to !== undefined && eventDate > to)) {
        return false;
      }
    }

    if (options.maxPriceCents !== undefined) {
      const price = cheapestPrice(summary);
      if (price === null || price > options.maxPriceCents) {
        return false;
      }
    }

    if (options.onlyAvailable === true && availableSeats(summary) < 1) {
      return false;
    }

    return true;
  });
}

function compareText(left, right) {
  const a = typeof left === 'string' ? left : '';
  const b = typeof right === 'string' ? right : '';
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareTitleAndId(left, right) {
  return compareText(left.title, right.title) || compareText(left.id, right.id);
}

function comparePrice(left, right) {
  const leftPrice = cheapestPrice(left) ?? Infinity;
  const rightPrice = cheapestPrice(right) ?? Infinity;
  return leftPrice - rightPrice || compareTitleAndId(left, right);
}

function compareAvailability(left, right) {
  return availableSeats(right) - availableSeats(left) || compareTitleAndId(left, right);
}

export function sortEvents(summaries, sortBy) {
  requireSummaries(summaries);
  if (!['date', 'price', 'availability'].includes(sortBy)) {
    fail(`Unknown sort option: ${sortBy}.`);
  }
  if (sortBy === 'date') {
    for (const summary of summaries) {
      parseISODate(summary.date, { label: 'Event date' });
    }
  }

  let compare;
  if (sortBy === 'date') {
    compare = (left, right) =>
      parseISODate(left.date, { label: 'Event date' }) -
        parseISODate(right.date, { label: 'Event date' }) ||
      compareTitleAndId(left, right);
  } else if (sortBy === 'price') {
    compare = comparePrice;
  } else {
    compare = compareAvailability;
  }

  return mergeSort(summaries, compare);
}

export function searchEvents(summaries, criteria, sortBy) {
  return sortEvents(filterEvents(summaries, criteria), sortBy);
}
