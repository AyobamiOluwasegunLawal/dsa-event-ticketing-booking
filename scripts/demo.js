import {
  addTier,
  bookTickets,
  cancelBooking,
  createEvent,
  createStore,
  findBookingByReference,
  joinWaitlist,
} from '../src/domain/inventory.js';

const store = createStore();
const event = createEvent(store, { name: 'Summer Sounds' });
const tier = addTier(store, event.id, {
  name: 'General admission',
  capacity: 3,
  priceCents: 5000,
});

console.log(`Event: ${event.name} (${tier.capacity} ${tier.name} tickets)`);

const adaBooking = bookTickets(store, {
  eventId: event.id,
  tierId: tier.id,
  attendeeName: 'Ada',
  quantity: 2,
});
console.log(`Ada booked ${adaBooking.quantity}; reference ${adaBooking.reference}.`);
console.log(`Booking lookup: ${findBookingByReference(store, adaBooking.reference).attendeeName}`);

bookTickets(store, {
  eventId: event.id,
  tierId: tier.id,
  attendeeName: 'Chidi',
  quantity: 1,
});
console.log('The event is now sold out.');

try {
  bookTickets(store, {
    eventId: event.id,
    tierId: tier.id,
    attendeeName: 'Bayo',
    quantity: 1,
  });
} catch (error) {
  if (error.code !== 'SOLD_OUT') {
    throw error;
  }
  console.log(`Bayo's booking was refused: ${error.code}.`);
}

joinWaitlist(store, { eventId: event.id, tierId: tier.id, attendeeName: 'Dara' });
joinWaitlist(store, { eventId: event.id, tierId: tier.id, attendeeName: 'Emeka' });
console.log('Dara and Emeka joined the waitlist.');

cancelBooking(store, adaBooking.reference);
console.log(`Ada cancelled; ${tier.available} seats are available again.`);
console.log(`Next in line: ${store.waitlists.get(tier.id).peek().attendeeName}.`);
