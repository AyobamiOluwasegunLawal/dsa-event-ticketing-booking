AI Development Log

Project: Event Ticketing and Booking System
Technology: JavaScript (ES Modules), Node.js
Purpose: Document AI assistance, review findings, corrections, and lessons learned throughout the capstone project.

Build 1: Domain Core in the Terminal

Date: [Enter date]
AI Tool Used: Copilot

1. What I Asked

I asked the AI to implement the first build of the Event Ticketing application using plain JavaScript, Node.js 22.13+, and ES modules without external packages.

My requirements included:

Creating a DomainError class with machine-readable error codes.

Generating secure booking IDs and readable references using node:crypto.

Implementing a FIFO queue using a linked list.

Implementing event creation, ticket tiers, bookings, cancellations, and waitlists.

Preventing overselling and ensuring failed bookings do not modify inventory.

Comparing Map.get() and Array.find() performance.

Creating a demonstration script and configuring npm scripts.

2. What the AI Returned

The AI provided an implementation consisting of:

File

Function

src/domain/errors.js

Domain-specific error handling

src/domain/ids.js

Secure identifier generation

src/domain/waitlistQueue.js

FIFO queue implementation

src/domain/inventory.js

Event and booking management

scripts/demo.js

Demonstration of booking operations

scripts/benchmark-lookup.js

Performance comparison

package.json

Project configuration

3. What Was Wrong With the AI's Output?

No issues were identified during my initial review and testing.

# Build 2: Event Search, Sorting and Automated Tests

**Date:** 7 November 2026  
**AI Tool:** GitHub Copilot (GPT-6 Luna)  
**Project:** Event Ticketing Capstone

## 1. What I Asked

I prompted GitHub Copilot to implement Build 2 of the Event Ticketing Capstone using plain JavaScript (ES modules), Node.js 22.13 or newer, and no external dependencies.

I instructed the AI to review the existing project documentation and domain modules before modifying the code, and to preserve all working Build 1 functionality.

The key requirements were:

- **Merge Sort:** Implement a custom, stable merge sort algorithm without using `Array.prototype.sort()`. The algorithm must return a new array without modifying the original.
- **Event Publishing:** Implement `publishEvent()` and `listEventSummaries()` to manage event visibility. Events without ticket tiers must not be published.
- **Event Search:** Implement pure functions for filtering, sorting, and searching events by title, venue, city, date range, ticket price, and availability.
- **Input Validation:** Reject invalid dates, prices, and sorting criteria using `DomainError` with appropriate error codes.
- **Automated Testing:** Create tests using Node.js's built-in `node:test` and `node:assert/strict` modules.
- **Package Configuration:** Add an `npm test` script to `package.json`.

I also requested that Copilot provide a list of all modified files and identify any ambiguous requirements.

## 2. What the AI Returned

GitHub Copilot reported implementing the Build 2 functionality and extending the existing domain logic.

### A. Implemented Functionality

**Sorting**
- Added a custom `mergeSort()` implementation.
- Implemented sorting by event date, ticket price, and availability.
- Included tie-breaking based on event title and ID.

**Event Management**
- Added event publishing functionality.
- Added public event summaries.
- Extended event information and booking-related logic to support Build 2 requirements.

**Search and Filtering**
- Implemented event filtering by search query, city, date range, maximum ticket price, and ticket availability.
- Added date validation and price filtering.
- Implemented `searchEvents()` by combining filtering and sorting.

**Automated Testing**
- Added automated tests for event search, filtering, sorting, and inventory management.
- Reported coverage of the requested acceptance criteria and edge cases.
- Added the `npm test` command.

### B. Files Modified or Created

Copilot reported changes to the following files:

| File | Purpose |
|---|---|
| `build-2.md` | Updated Build 2 documentation and acceptance criteria |
| `package.json` | Added test script |
| `demo.js` | Updated demonstration script |
| `dates.js` | Added or updated date handling |
| `eventSearch.js` | Implemented event search, filtering and sorting |
| `inventory.js` | Extended event and booking management |
| `sorting.js` | Implemented custom merge sort |
| `helpers.js` | Added supporting functionality |
| `event-search.test.js` | Added search and sorting tests |
| `inventory.test.js` | Added domain and inventory tests |

### C. Results Reported by Copilot

Copilot reported:

- `npm test` — **26 tests passed**
- `npm run demo` — **Executed successfully**

These were results reported by the AI, rather than independently verified results.

## 3. What Was Wrong or Unclear?

### Issue 1: Missing S04 Acceptance Criteria

Copilot identified that the S04 publishing acceptance criteria were incomplete in the Build 2 documentation.

Rather than leaving the criteria undefined, it introduced three publishing requirements:

1. An event with at least one ticket tier can be published.
2. An event without ticket tiers must be rejected when publishing.
3. Unpublishing an event removes it from the public event listing.

**Concern:** The original prompt explicitly requested `publishEvent()` but did not request an `unpublishEvent()` function. Copilot therefore expanded the implementation beyond the explicitly stated requirements.

### Issue 2: Additional Changes to Existing Logic

Copilot reported that the existing inventory required additional event fields and pending-booking semantics.

These changes went beyond simply adding the requested Build 2 functions.

**Concern:** The prompt specifically instructed Copilot not to change functionality that already worked. The reported modifications therefore require review to ensure that existing booking and cancellation behaviour remains correct.

### Issue 3: Changes to Project Documentation

Copilot modified `build-2.md` to define missing acceptance criteria.

**Concern:** Changes to assignment requirements should be distinguished from changes to application code. Any AI-generated additions to the specification should be reviewed before being accepted.