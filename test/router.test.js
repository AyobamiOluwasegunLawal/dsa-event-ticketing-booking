import assert from 'node:assert/strict';
import test from 'node:test';
import { Router } from '../src/http/router.js';

test('router matches methods and extracts named path parameters', async () => {
  const router = new Router();
  router.get('/events/:eventId/bookings/:bookingId', ({ params }) => params);

  const match = router.match('GET', '/events/event-1/bookings/booking-2');
  assert.deepEqual(match.params, { eventId: 'event-1', bookingId: 'booking-2' });
  assert.deepEqual(
    await router.dispatch('GET', '/events/event-1/bookings/booking-2'),
    { eventId: 'event-1', bookingId: 'booking-2' },
  );
  assert.equal(router.match('POST', '/events/event-1/bookings/booking-2'), null);
});

test('router matches static and root paths with optional trailing slashes', () => {
  const router = new Router();
  router.get('/', () => 'root');
  router.get('/health', () => 'healthy');

  assert.ok(router.match('GET', '/'));
  assert.ok(router.match('GET', '/health/'));
  assert.equal(router.match('GET', '/missing'), null);
});
