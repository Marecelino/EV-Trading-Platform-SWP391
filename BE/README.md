<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="96" alt="Nest logo" />
  <h1>EV Trading Platform – Backend</h1>
  <p>REST API for the second-hand EV &amp; battery marketplace built with NestJS + MongoDB.</p>
</div>

## ✨ Overview

This service powers the EV Trading Platform, covering:

- User registration, authentication, and account management (members &amp; admins)
- Listings lifecycle (create, search, price suggestions, recommendations)
- Transactions, commissions, and settlement tracking
- Social features: favourites, reviews, notifications
- Admin dashboard, moderation tooling, and analytics endpoints

All endpoints are served under the global prefix `http://localhost:3000/api`. Interactive docs are available at `http://localhost:3000/docs` once the server is running.

## 🧱 Tech stack

- **Runtime:** Node.js 18+, NestJS 11
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (Bearer tokens), Passport.js
- **Validation:** class-validator + class-transformer
- **Tooling:** ESLint, Prettier, Jest, Swagger

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # or set MONGODB_URL/JWT_SECRET variables manually

# 3. Run in watch mode
npm run start:dev

# Optional: production build
npm run build
npm run start:prod
```

### Environment variables

| Name            | Default                                              | Description                           |
|-----------------|------------------------------------------------------|---------------------------------------|
| `MONGODB_URL`   | `mongodb://localhost:27017/ev_battery_platform`     | MongoDB connection string             |
| `JWT_SECRET`    | `super-secret-key`                                   | Symmetric key for JWT signing         |
| `JWT_EXPIRES_IN`| `604800` (seconds ≈ 7 days)                          | Access token lifetime                 |

> On bootstrap the service seeds a default admin account (`admin@ev-platform.test` / `Admin123!`) if none exists.

## 📚 Modules & key endpoints

| Module          | Highlights                                                                                               |
|-----------------|-----------------------------------------------------------------------------------------------------------|
| **Auth**        | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` (JWT protected)                            |
| **Users**       | CRUD for members, filtering by role/status, admin status management                                       |
| **Listings**    | Create/update listings, full-text search & filters, price suggestions, recommendations, view tracking     |
| **Transactions**| Booking flow, status updates (pending → completed/cancelled), automatic listing status sync              |
| **Favorites**   | Add/remove favourites, list by user, favourite count aggregation for listings                             |
| **Reviews**     | Post & moderate buyer/seller reviews, visibility toggles, rating stats                                     |
| **Notifications**| System/user alerts, mark-as-read, bulk acknowledgement                                                    |
| **Admin**       | Dashboard metrics, listing approvals, user moderation, review moderation                                  |
| **Analytics**   | Revenue by month, popular brands, favourites trend, overall KPIs                                          |

Swagger schemas are generated automatically; head to `/docs` for request/response examples.

## ✅ Quality

```bash
# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

The CI-friendly `npm run build` command compiles the entire project and is used locally to ensure type-safety.

## 🧭 Project structure

```
src/
  auth/            # authentication & JWT guard logic
  users/           # user management (members, admins)
  listings/        # marketplace listings, search, price heuristics
  transactions/    # order lifecycle & commission handling
  favorites/       # saved listings per user
  reviews/         # buyer/seller feedback
  notifications/   # in-app notifications
  admin/           # moderation + dashboard orchestration
  analytics/       # aggregated stats for charts and reports
  model/           # Mongoose schemas
```

## 🔐 Security notes

- Always replace the default `JWT_SECRET` in production.
- Consider enabling HTTPS termination and rate limiting at the gateway layer.
- Passport guards are in place for profile endpoints; extend them across modules as the client integrates auth contexts.

## 🛣️ Roadmap / next steps

- Integrate real payment provider hooks for transaction settlement
- Add WebSocket or SSE notifications for real-time updates
- Expand automated test coverage beyond sample specs (unit + e2e)

---

Happy coding! Reach out via issues or code comments if you extend the API surface.
