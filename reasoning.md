Engineering Reasoning

1. Problem Understanding

The Café Rewards Engine is more than a simple points counter. The system must maintain correct reward calculations while also handling retries, concurrent requests, expiration and external notifications.

The main engineering requirements are:

Correct tier-based point calculation

Atomic member and ledger updates

Idempotent POS requests

Safe concurrent redemption

90-day point expiration

Tier-change notifications

Authentication

Clear separation of responsibilities

Because these requirements affect the same data, reward operations are implemented as transactional business workflows.

2. Architecture

The backend follows:

Routes
   ↓
Middleware / Validation
   ↓
Controllers
   ↓
Services
   ↓
Models
   ↓
MongoDB

Routes define HTTP endpoints and middleware composition.

Validators check incoming requests.

Controllers handle HTTP-specific responsibilities.

Services contain the actual reward rules and transaction logic.

Models define MongoDB collections and indexes.

Utilities contain reusable logic such as tier calculation and phone normalization.

This separation keeps the business logic independent from the HTTP layer.

3. Tier Calculation

The reward system has four tiers:

Lifetime Points

Tier

Earn Rate

< 500

Bronze

1.0x

500 - 1499

Silver

1.25x

1500 - 4999

Gold

1.5x

>= 5000

Platinum

0.3x

The earning rate is determined using the member's tier before the purchase.

For example, if a member has 490 lifetime points and the purchase generates 20 points, the member becomes Silver after the purchase, but that purchase still uses the Bronze rate. Silver applies to the next purchase.

4. Platinum Compatibility

Platinum was introduced as an additional top tier:

Lifetime points >= 5000
Earn rate = 0.3x

No migration is required for existing members. Their tier is calculated dynamically from lifetime points, so historical balances and transactions remain unchanged.

5. Atomicity

An earn operation modifies multiple records:

Member
+
EARN Transaction
+
Optional Outbox Event

These represent one logical operation and therefore are committed using a MongoDB transaction.

If one operation fails, the transaction is rolled back.

6. Idempotency

POS systems can retry requests when network failures occur. A unique referenceId prevents the same reward operation from being applied twice.

The service checks whether the reference already exists. If it does, the existing transaction is returned.

The database unique constraint provides an additional safeguard.

7. Concurrency

A naive redemption implementation could read the balance, modify it in JavaScript and save it later. Two concurrent requests could then operate on the same stale balance.

The implementation instead uses an atomic conditional update:

currentBalance >= requestedPoints

combined with an atomic decrement.

If another request has already consumed the available balance, the update fails and the service returns a concurrency error.

8. Transaction Ledger

The current balance alone is not sufficient to support expiry.

Each EARN transaction tracks:

pointsAmount
remainingPoints
expiresAt
expired

For example, if two earning transactions contain 100 and 200 points and the member redeems 150, the oldest transaction becomes fully consumed and 150 points remain on the second transaction.

9. Redemption Strategy

Redemption consumes the oldest available EARN transactions first.

This FIFO strategy is useful because older points are closer to expiration and should be consumed before newer points.

10. Point Expiration

Unused earned points expire after 90 days.

Each EARN transaction receives an expiry date:

expiresAt = earning date + 90 days

The /clock endpoint processes transactions whose expiry date has passed.

For each eligible transaction:

Decrease the member's current balance.

Set remainingPoints to zero.

Mark the EARN transaction as expired.

Create an EXPIRE ledger transaction.

These operations occur inside a MongoDB transaction.

11. Lifetime Points vs Current Balance

Two different values are intentionally maintained.

lifetimePoints represents cumulative historical earning activity.

currentBalance represents points currently available for redemption.

When points expire, current balance decreases but lifetime points remain unchanged. This preserves the member's lifetime tier qualification.

12. Outbox Pattern

Tier changes need to trigger the Notification Service. Directly calling an external service from the reward transaction would tightly couple the systems.

Instead, a MEMBER_TIER_CHANGED event is stored in an Outbox.

The reward update, ledger entry and Outbox event are committed in the same transaction.

A separate Notification Service can later consume the event.

13. Tier Change Detection

The service calculates the old tier before the purchase and the new tier after calculating the new lifetime points.

If:

oldTier !== newTier

a MEMBER_TIER_CHANGED Outbox event is created.

Normal lifetime-point progression means tier changes are upward.

14. Authentication

Reward mutations change member state, so they require authentication.

The flow is:

Register
   ↓
bcrypt password hash
   ↓
Store user
   ↓
Login
   ↓
Verify password
   ↓
Generate JWT
   ↓
Bearer Token
   ↓
Protected API

Passwords are never stored in plaintext.

15. Phone Normalization

Different phone formats can represent the same member. The application normalizes phone numbers before database operations.

For example:

9876543210
      ↓
+919876543210

The normalized phone is stored with a unique constraint.

16. Validation

Zod validates incoming API data before business logic executes.

Examples include positive purchase amounts, positive redemption amounts, required reference IDs, usernames and passwords.

Invalid input returns HTTP 400.

17. Error Handling

Centralized error handling separates:

Status

Meaning

400

Invalid input

401

Authentication failure

404

Member not found

409

Concurrency/idempotency conflict

422

Business rule failure

500

Unexpected server error

For example, insufficient points is a valid request that violates a business rule, so it returns 422.

18. Frontend Design

The frontend separates authentication from the rewards dashboard:

Login / Register
       ↓
JWT Authentication
       ↓
Rewards Dashboard

The dashboard provides member lookup, tier and balance information, earning, redemption, expiry-clock execution, Outbox viewing and logout.

19. Vite Proxy

The frontend uses a Vite development proxy for:

/api
/clock
/outbox

This lets the browser use relative API paths while Vite forwards requests to the backend.

20. Database Design

The main collections are:

users
members
pointstransactions
outboxes

Important indexed fields include member phone, transaction reference ID, member ID, expiry date, event type and processing state.

21. Design Tradeoffs

MongoDB was retained because it fits the existing application and supports the required multi-document transactions.

The transaction ledger uses more storage than a balance-only design, but it provides traceability, idempotency and expiry support.

The Outbox adds another persistence layer but makes notification integration reliable and decoupled.

JWT provides simple stateless authentication for the REST API. A larger production system could additionally use refresh tokens and stronger session management.

22. Final Design

The final architecture focuses on:

Correct Reward Calculation
          +
Atomic Transactions
          +
POS Idempotency
          +
Concurrency Safety
          +
90-Day Expiry
          +
Authentication
          +
Reliable Notifications
          +
Clear Separation of Concerns

The design leaves clear extension points for background workers, a real Notification Service, administration and production observability.