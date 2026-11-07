import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertTransition,
  BOOKING_STATES,
  BOOKING_TRANSITIONS,
  canTransition,
} from '../src/domain/bookingStateMachine.js';
import { DomainError } from '../src/domain/errors.js';

test('booking state machine defines all lifecycle states as data', () => {
  assert.deepEqual(BOOKING_STATES, [
    'pending',
    'paid',
    'cancelled',
    'refunded',
    'checked_in',
  ]);
  assert.deepEqual(BOOKING_TRANSITIONS, {
    pending: ['paid', 'cancelled'],
    paid: ['checked_in', 'refunded', 'cancelled'],
    cancelled: [],
    refunded: [],
    checked_in: [],
  });
});

test('every allowed booking transition is accepted', () => {
  for (const [from, destinations] of Object.entries(BOOKING_TRANSITIONS)) {
    for (const to of destinations) {
      assert.equal(canTransition(from, to), true, `${from} -> ${to}`);
      assert.equal(assertTransition(from, to), undefined);
    }
  }
});

test('every other state pair is rejected with INVALID_TRANSITION', () => {
  for (const from of BOOKING_STATES) {
    for (const to of BOOKING_STATES) {
      if (BOOKING_TRANSITIONS[from].includes(to)) {
        continue;
      }

      assert.equal(canTransition(from, to), false, `${from} -> ${to}`);
      assert.throws(
        () => assertTransition(from, to),
        (error) => error instanceof DomainError && error.code === 'INVALID_TRANSITION',
        `${from} -> ${to}`,
      );
    }
  }
});

test('unknown states are rejected safely', () => {
  assert.equal(canTransition('__proto__', 'paid'), false);
  assert.throws(
    () => assertTransition('unknown', 'paid'),
    (error) => error instanceof DomainError && error.code === 'INVALID_TRANSITION',
  );
});
