AI Development Log

Project

Café Rewards Engine

Purpose

AI assistance was used as an engineering copilot during development for requirement analysis, architecture planning, database design, API design, debugging, concurrency reasoning, authentication, point expiry, Outbox integration, frontend integration and documentation.

The suggestions were reviewed and adapted to the actual project structure and requirements.

1. Initial Architecture

The project started with a Node.js, Express and MongoDB backend.

The backend was organized into:

Routes

Controllers

Services

Models

Validators

Middleware

Utilities

This structure was retained as requirements expanded.

2. Core Reward System

The initial requirements included:

Member lookup

Tier-based earning

Point redemption

Lifetime points

Current balance

Transaction history

Atomic updates

POS idempotency

The implementation focused first on the core reward workflow.

3. Tier System

The original system contained Bronze, Silver and Gold.

A Platinum tier was added later:

Platinum
Lifetime points >= 5000
Earn rate = 0.3x

Final boundaries:

Bronze    < 500
Silver    500 - 1499
Gold      1500 - 4999
Platinum  >= 5000

The tier rules were isolated in a dedicated utility.

4. Tier Boundary Rule

A key business rule was identified: the tier at the beginning of a purchase determines that purchase's earning rate.

Example:

Lifetime = 490
Current tier = Bronze
Purchase earns = 20
New lifetime = 510
New tier = Silver

The purchase still uses the Bronze rate. Silver applies to the next purchase.

5. Phone Normalization

A phone normalization utility was implemented to ensure different representations of the same phone number resolve to the same member.

Example:

9876543210
      ↓
+919876543210

The normalized phone is protected by a unique constraint.

6. Validation

Zod validators were introduced for authentication and reward APIs.

Validation covers:

Username

Password

Phone

Purchase amount

Redemption amount

Reference ID

Invalid input is rejected before entering business logic.

7. MongoDB Transactions

Transactions were introduced because member state and ledger records must remain consistent.

For earning:

Member update
+
EARN transaction
+
Optional tier-change Outbox event

are committed together.

For expiry:

Member balance update
+
EARN expiration
+
EXPIRE transaction

are also handled transactionally.

8. Idempotency

POS retry behavior was identified as an important reliability requirement.

A unique referenceId was selected as the idempotency key.

The service checks for an existing transaction before processing a new operation.

Therefore:

First request
     ↓
Operation processed

Retry
     ↓
Existing transaction returned

The reward is not applied twice.

9. Concurrency

A potential redemption race condition was identified.

A simple read-modify-save approach could allow concurrent requests to operate on stale balances.

The implementation uses an atomic conditional MongoDB update requiring:

currentBalance >= pointsToRedeem

before decrementing the balance.

10. Transaction-Level Point Tracking

The 90-day expiry requirement required the system to know how many points from each earning transaction remained unused.

The transaction model was extended with:

remainingPoints
expiresAt
expired

This supports precise redemption and expiration.

11. FIFO Redemption

Redemption consumes the oldest available EARN transactions first.

Example:

EARN A = 100
EARN B = 200

Redeem = 150

EARN A remaining = 0
EARN B remaining = 150

This supports deterministic expiry behavior.

12. 90-Day Expiry

Each EARN transaction receives an expiry timestamp based on the earning time plus 90 days.

The /clock endpoint was introduced to process expired points.

The optional asOf timestamp makes expiry behavior deterministic and testable without waiting 90 actual days.

13. Expiration Ledger

When points expire:

Current balance decreases
        ↓
Original EARN transaction marked expired
        ↓
remainingPoints becomes zero
        ↓
EXPIRE transaction created

These changes are executed in a MongoDB transaction.

14. Lifetime Points Decision

A distinction was maintained between:

lifetimePoints

and:

currentBalance

Expiration decreases current balance but does not decrease lifetime points because lifetime points represent cumulative historical earning activity.

15. Notification Integration

A tier-change notification requirement was introduced.

Instead of directly calling an external Notification Service, the Outbox Pattern was selected.

When a tier changes, the system creates:

MEMBER_TIER_CHANGED

with information such as:

member ID

phone

previous tier

new tier

lifetime points

16. Transactional Outbox

The Outbox event is created inside the same MongoDB transaction as the reward and member updates.

This ensures that a committed tier change has a corresponding persisted notification event.

17. Outbox API

The following endpoint was added:

GET /outbox

It exposes generated events for integration and verification.

A future Notification Service can consume these events asynchronously.

18. Authentication

JWT authentication and bcrypt password hashing were added.

The flow is:

Register
↓
Hash password
↓
Store user
↓
Login
↓
Verify password
↓
Generate JWT
↓
Bearer authentication

Reward mutation endpoints require authentication.

19. Frontend Authentication

The frontend was changed from a direct rewards screen into an authentication flow:

Login / Register
       ↓
Successful Authentication
       ↓
Rewards Dashboard

The JWT is stored locally and attached to protected API requests.

20. Frontend Features

The React dashboard includes:

Login

Registration

Logout

Member lookup

Member details

Tier

Earn rate

Lifetime points

Current balance

Earn points

Redeem points

Expiry clock

Notification Outbox

The UI was redesigned into a responsive dashboard-style interface.

21. Vite Proxy

The frontend development environment uses a Vite proxy for:

/api
/clock
/outbox

This allows relative frontend API paths while Vite forwards them to the backend.

22. Debugging — Phone Normalization

A phone normalization issue was identified around local numbers that begin with country-code digits.

The logic was adjusted to distinguish local 10-digit numbers from numbers that already include the country code.

The normalized result follows E.164 format.

23. Debugging — Tier Calculation

During tier-change implementation, pointsEarned was initially referenced before it was declared.

Incorrect order:

newLifetime = lifetime + pointsEarned
pointsEarned = purchaseAmount * earnRate

Correct order:

current tier
      ↓
earning rate
      ↓
points earned
      ↓
new lifetime
      ↓
new tier

This resolved the runtime issue.

24. Development Verification

The implementation was tested during development for:

Health endpoint

Member lookup

Phone normalization

Tier boundaries

Point earning

Point redemption

Insufficient balance

Reference ID idempotency

JWT login

Protected earning

Frontend lookup

Frontend authentication

Expiry and Outbox behavior were implemented with explicit endpoints for deterministic verification.

25. Engineering Principles

Separation of Concerns

Each application layer has a focused responsibility.

Atomicity

Related database changes are committed together.

Idempotency

Repeated POS requests do not duplicate reward operations.

Concurrency Safety

Critical balance updates use database-level conditions.

Security

Passwords are hashed and reward mutations require authentication.

Auditability

Reward operations are represented in transaction records.

Extensibility

The Outbox Pattern provides a clean integration boundary for future notification processing.

26. Final System

The completed system combines:

React
+
Vite
+
Node.js
+
Express
+
MongoDB
+
Mongoose
+
Zod
+
JWT
+
bcrypt
+
MongoDB Transactions
+
Idempotency
+
90-Day Expiry
+
Outbox Pattern

The architecture leaves room for future background workers, a real Notification Service, administrative APIs, monitoring and production deployment.