# ☕ Café Rewards Engine

A production-oriented rewards management system for a café chain.

The system manages customer membership, tier-based point earning, point redemption, point expiration, POS idempotency, concurrent updates, authentication, and asynchronous tier-change notifications.

---

## 📌 Overview

Members earn reward points whenever they make a purchase.

Their earning rate depends on their cumulative lifetime points:

| Tier | Lifetime Points | Earn Rate |
|------|-----------------|-----------:|
| Bronze | `< 500` | 1.0x |
| Silver | `500 - 1499` | 1.25x |
| Gold | `1500 - 4999` | 1.5x |
| Platinum | `>= 5000` | 0.3x |

A critical business rule is that the **tier at the start of a purchase determines the earning rate for that purchase**.

For example, if a Bronze member has 490 lifetime points and a purchase earns 20 points, the member becomes Silver after the purchase, but the purchase itself is calculated using the Bronze rate.

---

# ✨ Features

### Member Management
- Member lookup using phone number
- Phone normalization to E.164 format
- Unique phone number constraint

### Rewards
- Tier-based point earning
- Point redemption
- Lifetime point tracking
- Current available balance
- Platinum tier support

### Reliability
- MongoDB transactions
- POS idempotency using `referenceId`
- Atomic balance updates
- Concurrent redemption protection
- Consistent reward ledger

### Point Expiration
- Earned points expire after 90 days
- Tracks remaining points per earning transaction
- `/clock` endpoint for deterministic expiry processing
- Creates explicit `EXPIRE` ledger transactions

### Notifications
- Outbox Pattern
- Tier-change events
- `MEMBER_TIER_CHANGED` event type
- `/outbox` endpoint for integration/inspection

### Security
- JWT authentication
- bcrypt password hashing
- Protected reward mutation APIs
- Request validation using Zod

### Frontend
- React + Vite
- Login/Register flow
- Authenticated dashboard
- Member lookup
- Earn and redeem operations
- Tier and balance display
- Expiry clock
- Notification outbox viewer
- Responsive UI

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Express REST API │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication    Validation       Controllers
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │    Service Layer    │
                    │  Business Logic     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ MongoDB / Mongoose  │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
          Members        Transactions         Outbox
                                                │
                                                ▼
                                      Notification Service


                                      🛠️ Tech Stack
Frontend
React
Vite
Axios
CSS
Backend
Node.js
Express.js
MongoDB
Mongoose
Zod
JSON Web Token
bcryptjs
Development
Git
GitHub
Postman / curl

AURIGA-IT-Divyansh-Tak/
│
├── README.md
├── REASONING.md
├── AILOGS.md
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── clock.controller.js
│   │   │   ├── outbox.controller.js
│   │   │   └── rewards.controller.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validate.middleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── member.model.js
│   │   │   ├── outbox.model.js
│   │   │   ├── pointsTransaction.model.js
│   │   │   └── user.model.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── outbox.routes.js
│   │   │   └── rewards.routes.js
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   └── rewards.service.js
│   │   │
│   │   ├── utils/
│   │   │   ├── appError.js
│   │   │   ├── phone.js
│   │   │   └── tier.js
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   └── rewards.validator.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── vite.config.js
    └── package.json

 Start backend :   npm run dev

 Start frontend

Open another terminal:

cd frontend
npm install
npm run dev

Register
POST /api/auth/register
Content-Type: application/json
{
  "username": "staff",
  "password": "password123"
}

Registration creates a STAFF account.

Login
POST /api/auth/login
Content-Type: application/json
{
  "username": "staff",
  "password": "password123"
}

The response contains a JWT.

Protected endpoints require:

Authorization: Bearer <token>
📡 API Reference
Member Lookup
GET /api/rewards/member/:phone

Example:

GET /api/rewards/member/9876543210

The phone number is normalized before lookup.

Earn Points
POST /api/rewards/earn

Authentication required.

Request:

{
  "phone": "9876543210",
  "purchaseAmount": 100,
  "referenceId": "PURCHASE-001"
}

The earning rate is determined from the member's tier before the purchase.

Redeem Points
POST /api/rewards/redeem

Authentication required.

Request:

{
  "phone": "9876543210",
  "pointsToRedeem": 50,
  "referenceId": "REDEEM-001"
}

If insufficient points are available, the API returns:

422 Unprocessable Entity
Run Expiry Clock
POST /clock

Optional request body:

{
  "asOf": "2026-09-17T00:00:00.000Z"
}

If asOf is not provided, the current time is used.

The endpoint expires all eligible unused points.

View Outbox
GET /outbox

Returns generated notification events.

Example:

{
  "success": true,
  "data": [
    {
      "eventType": "MEMBER_TIER_CHANGED",
      "payload": {
        "previousTier": "Bronze",
        "newTier": "Silver"
      }
    }
  ]
}
🔄 Point Lifecycle

An earned point follows this lifecycle:

                    EARN
                      │
                      ▼
              Available Points
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
          REDEEM             90 Days
             │                 │
             ▼                 ▼
          Consumed           EXPIRE

Each earning transaction tracks:

pointsAmount
remainingPoints
expiresAt
expired

This allows the system to determine exactly how many points remain available for redemption or expiration.

🧾 Transaction Ledger

The ledger supports three transaction types:

Type	Purpose
EARN	Points generated from a purchase
REDEEM	Points consumed by a member
EXPIRE	Unused points removed after expiry

The ledger provides traceability instead of relying only on the member's current balance.

⚡ Idempotency

POS systems may retry requests when a response is lost.

The system uses a unique referenceId.

Example:

PURCHASE-001

If the POS sends the same request again:

First request  → points applied
Retry          → existing transaction returned

The member is not awarded points twice.

🔒 Concurrency

Redemption uses an atomic MongoDB conditional update.

Conceptually:

Only update when:

currentBalance >= pointsToRedeem

and then:

currentBalance -= pointsToRedeem

This prevents concurrent requests from driving the balance below zero.

⏳ Point Expiry

Every EARN transaction receives:

expiresAt = earnedAt + 90 days

Unused points are processed through /clock.

For an expired earning transaction:

Member balance
      ↓
decrease by remaining points

EARN transaction
      ↓
remainingPoints = 0
expired = true

EXPIRE transaction
      ↓
created in ledger

The complete operation occurs within a MongoDB transaction.

🔔 Notification Outbox

When a member moves to a new tier, the system creates:

MEMBER_TIER_CHANGED

The event contains:

memberId
phone
previousTier
newTier
lifetimePoints

The Outbox event is created in the same transaction as the reward operation.

This means the reward update and notification event cannot become inconsistent because one succeeded while the other failed.

A future worker can read /outbox and deliver events to the Notification Service.

🗄️ Database Collections
users

Stores authentication information.

username
passwordHash
role
members

Stores current reward state.

phone
name
lifetimePoints
currentBalance
pointstransactions

Stores the reward ledger.

memberId
type
pointsAmount
remainingPoints
purchaseAmount
referenceId
expiresAt
expired
outboxes

Stores integration events.

eventType
memberId
payload
processed
❌ Error Handling

The API uses centralized error handling.

HTTP Status	Meaning
200	Successful operation
201	Resource created
400	Invalid request
401	Authentication failure
404	Member not found
409	Idempotency/concurrency conflict
422	Business rule failure
500	Unexpected server error
🧪 Testing

Important scenarios to verify:

Tier boundaries
499  → Bronze
500  → Silver
1499 → Silver
1500 → Gold
4999 → Gold
5000 → Platinum
Tier crossing

Verify that a purchase crossing a boundary uses the old tier's rate.

Idempotency

Send the same referenceId twice and verify that points are not duplicated.

Redemption

Verify:

Successful redemption
Insufficient balance
Concurrent redemption
Expiry

Create an earning transaction, move its expiry date into the past and call:

POST /clock
Notifications

Cross a tier boundary and verify:

GET /outbox

contains:

MEMBER_TIER_CHANGED
Authentication

Verify:

Login
Invalid credentials
Missing token
Invalid token
Protected earn
Protected redeem
📌 Design Goals

The implementation focuses on:

Correct reward calculation
Strong consistency
Safe concurrent updates
Reliable POS retries
Auditable reward transactions
Secure API access
Extensible notification integration
Clear separation of concerns
🔮 Future Improvements
Background Outbox worker
Real Notification Service integration
Refresh token support
Admin-only user management
Audit logging
Automated scheduled expiry worker
Comprehensive automated test suite
Rate limiting
Production monitoring and observability
HTTPS deployment
License

This project was developed as a software engineering project demonstrating backend architecture, database consistency, authentication and full-stack integration.
EOF



