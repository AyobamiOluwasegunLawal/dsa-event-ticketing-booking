import { performance } from 'node:perf_hooks';

const BOOKINGS = 100_000;
const LOOKUPS = 500;
const bookings = Array.from({ length: BOOKINGS }, (_, index) => ({
  reference: `BOOK-${index}`,
}));
const bookingsByReference = new Map(
  bookings.map((booking) => [booking.reference, booking]),
);
const targetReference = bookings.at(-1).reference;

function timeLookups(lookup) {
  const start = performance.now();
  for (let index = 0; index < LOOKUPS; index += 1) {
    lookup(targetReference);
  }
  return performance.now() - start;
}

const arrayFindMs = timeLookups((reference) =>
  bookings.find((booking) => booking.reference === reference),
);
const mapGetMs = timeLookups((reference) => bookingsByReference.get(reference));

console.log(`Bookings: ${BOOKINGS.toLocaleString()} | lookups: ${LOOKUPS}`);
console.log(`Array.find: ${arrayFindMs.toFixed(2)} ms (O(n) per lookup)`);
console.log(`Map.get:    ${mapGetMs.toFixed(2)} ms (O(1) average per lookup)`);
