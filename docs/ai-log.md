AI Development Log

Project: Event Ticketing and Booking System
Technology: JavaScript (ES Modules), Node.js
Purpose: Document AI assistance, review findings, corrections, and lessons learned throughout the capstone project.

Build 1: Domain Core in the Terminal

Date: [Enter date]
AI Tool Used: ChatGPT (GPT-6)

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

Build 3: System Architecture, Booking State Machine and HTTP Server

Date: 7 November 2026
AI Tool: GitHub Copilot (GPT-6 Luna)
Project: Event Ticketing Capstone

1. What I Asked

I instructed GitHub Copilot to implement Build 3 of the Event Ticketing Capstone using plain JavaScript (ES modules), Node.js 22.13 or newer, and no external packages.

I specifically requested that Copilot review README.md, docs/user-stories.md, docs/build-3.md, and all existing domain modules before making changes. I also instructed it not to modify existing functionality that already worked.

The requirements were:

System Architecture: Create docs/architecture.md containing three Mermaid diagrams illustrating the application layers, data model, and booking lifecycle. Each architectural layer must have clearly defined responsibilities and restrictions.

Booking State Machine: Implement bookingStateMachine.js with five booking states: pending, paid, cancelled, refunded, and checked_in. Only specified transitions should be permitted, with invalid transitions throwing a DomainError carrying the code INVALID_TRANSITION.

HTTP Router and Server: Implement a lightweight router and HTTP server using Node.js's built-in node:http module, including route parameters, centralized JSON error handling, a /health endpoint, and secure static-file serving.

Server Configuration: Configure the server to use the PORT environment variable, defaulting to port 3000, and add an npm start script.

Automated Testing: Implement tests using node:test for valid and invalid booking transitions, router functionality, and a real HTTP request to /health.

I also specified that stack traces must never be exposed to clients and that business rules must remain outside HTTP route handlers.

2. What the AI Returned

GitHub Copilot reported completing the Build 3 implementation, including the booking state machine, HTTP infrastructure, server configuration, and automated tests.

A. Implemented Functionality

System Architecture

Reviewed the existing architecture.md.

Reported that the three Mermaid diagrams and layer responsibility descriptions were already present.

Left the architecture document unchanged.

Booking State Machine

Implemented the five specified booking states.

Added functions for checking and enforcing valid state transitions.

Added automated tests covering permitted and prohibited transitions.

HTTP Infrastructure

Implemented a lightweight HTTP router supporting methods, paths, and route parameters.

Added a server using Node.js's built-in HTTP functionality.

Implemented the /health endpoint.

Added centralized JSON error handling.

Implemented static-file serving from the public/ directory.

Server Configuration

Updated the server entry point and configuration.

Added support for starting the application through npm start.

Automated Testing

Added tests for the booking state machine.

Added router tests.

Added HTTP integration tests.

B. Files Reported as Changed

File

Purpose

package.json

Updated project scripts

public/index.html

Added a basic public HTML page

src/domain/bookingStateMachine.js

Implemented booking lifecycle transitions

src/http/router.js

Implemented HTTP routing

src/http/app.js

Implemented HTTP server functionality

src/config.js

Added server configuration

src/server.js

Updated server entry point

test/booking-state-machine.test.js

Added booking transition tests

test/router.test.js

Added router tests

test/http.test.js

Added HTTP integration tests

Copilot also reported that docs/architecture.md already met the requirements and therefore did not require modification.

The final change summary showed eight changed files, although the implementation summary listed ten. The exact file changes should therefore be confirmed against Git.

C. Results Reported by Copilot

Copilot reported the following results:

37 automated tests passed.

npm start successfully launched the HTTP server.

GET /health returned {"status":"ok"}.

The existing Build 1 demonstration continued to work.

These results were reported by Copilot and have not been independently verified in this review.

3. What Was Wrong or Unclear?

Issue 1: Patch Application Failure

During implementation, Copilot encountered an Apply Patch failed error.

It subsequently continued the implementation using additional commands and edits.

Observation: Although the final tests reportedly passed, the failed patch operation should be reviewed to ensure no intended changes were omitted.

Issue 2: Inconsistency in the Changed-File Report

Copilot listed ten files in its final implementation summary, but its final change statistics indicated eight changed files.

Observation: This creates uncertainty about the exact files created or modified during the session.

The actual changes can be verified using:

git status
git diff --stat

Issue 3: Architecture Documentation Was Not Modified

Copilot reported that docs/architecture.md already contained the required diagrams and descriptions.

Observation: This may be acceptable if the existing document fully satisfies Build 3 requirements. However, the diagrams and architectural restrictions should be reviewed before confirming compliance.

Unclear Requirements

Copilot explicitly reported that no rules were unclear.

The issues identified above concern implementation reporting and verification rather than ambiguities in the original requirements.
