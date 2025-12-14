# Catotel API

Catotel API is a NestJS service that demonstrates production-grade authentication patterns on top of Prisma/PostgreSQL. It ships with defense-in-depth controls such as short-lived access tokens, rotating refresh tokens, session device management, and strict environment validation so you can plug in a client application with minimal effort.

## Key Features
- Access and refresh tokens with per-device session tracking and automatic rotation.
- Hashed refresh tokens stored in the database with configurable session limits (default: three active devices per user).
- DTO-driven validation (`class-validator`) enforced via global validation pipes, keeping request payloads tidy.
- Environment schema validation powered by Zod to catch misconfiguration early.
- Health checks, Prisma integration, and modular structure ready for additional domains.
- Cat-hotel domain modules: customers (profiles & cats), rooms inventory, add-on services, reservations with multi-cat support, payments stubs, staff care tasks, and immutable activity logs.

## Getting Started

```bash
npm install
cp .env.example .env # adjust secrets and database credentials
npx prisma generate   # sync Prisma client with your database schema
npm run start:dev
```

The server boots with a global `/api` prefix and URI versioning (`/api/v1`). Adjust the exposed port or other settings via environment variables.

## Environment Variables

| Name | Description | Default |
| ---- | ----------- | ------- |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | `development`, `test`, or `production` | `development` |
| `DATABASE_URL` | PostgreSQL connection string (Prisma format) | `-` |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins (startup fails if empty/invalid) | `http://localhost:3000,http://localhost:3001` |
| `ACCESS_TOKEN_SECRET` | HMAC secret for access tokens | `-` |
| `REFRESH_TOKEN_SECRET` | HMAC secret for refresh tokens | `-` |
| `ACCESS_TOKEN_TTL` | Access token lifetime (jsonwebtoken format) | `15m` |
| `REFRESH_TOKEN_TTL` | Refresh token lifetime | `7d` |
| `JWT_ISSUER` | JWT issuer claim | `catotel-api` |
| `JWT_AUDIENCE` | JWT audience claim | `catotel-client` |
| `MAX_SESSIONS_PER_USER` | Maximum allowed concurrent sessions per user | `3` |
| `RATE_LIMIT_TTL` | Rate-limit window in seconds | `60` |
| `RATE_LIMIT_LIMIT` | Max requests allowed per window | `120` |
| `MAIL_ENABLED` | Set to `true` to boot the SMTP mailer | `false` |
| `SMTP_HOST` | Outgoing SMTP host (e.g. `smtp.gmail.com`) | `smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS/SSL (set `true` for port 465) | `false` |
| `SMTP_USERNAME` | SMTP auth username (usually the mailbox) | `-` |
| `SMTP_PASSWORD` | SMTP auth password or provider token | `-` |
| `MAIL_FROM` | Display name + email shown in the From header | `"Catotel <noreply@catotel.dev>"` |
| `PASSWORD_RESET_URL` | Absolute URL of the frontend reset form | `http://localhost:3100/auth/reset-password` |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | Minutes before a reset token expires | `30` |
| `PASSWORD_RESET_EMAIL_WINDOW_MINUTES` | Throttle window (minutes) for password reset/setup emails per address | `15` |
| `PASSWORD_RESET_EMAIL_MAX_PER_WINDOW` | Max reset/setup emails allowed per address in the throttle window | `3` |

All variables are validated during bootstrap; the application refuses to start if any are missing or malformed.

### Transactional email checklist

1. Generate dedicated SMTP credentials (Mailtrap, Mailgun, AWS SES, or Gmail/Google Workspace). Avoid reusing your personal password.
2. Set `MAIL_ENABLED=true` and fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `MAIL_FROM`.
3. Keep `MAIL_FROM` in the `Name <email@domain>` format so SPF/DKIM filters can recognise the sender.
4. Point `PASSWORD_RESET_URL` at the public Next.js route that renders the reset form so the email button opens the correct UI.
5. Production deployments should use domain-authenticated providers (SPF, DKIM, DMARC) instead of consumer inboxes.

> **Gmail-specific tip:** enable 2-Step Verification on the Google account, create an *App Password* under **Security → App passwords**, pick *Mail* and *Other*, then copy the 16-character code *without spaces* into `SMTP_PASSWORD`. Combine it with `SMTP_USERNAME=<full Gmail address>`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, and `SMTP_SECURE=true`.

## Authentication Flow

1. **Register** via `POST /api/v1/users/register` with email, password (min 8 chars), and optional display name.
2. **Login** at `POST /api/v1/auth/login` to receive an access token (15 minutes) and a refresh token (7 days). Refresh tokens are hashed and stored alongside device metadata.
3. **Refresh** tokens through `POST /api/v1/auth/refresh` to rotate both tokens atomically. Reuse of stale refresh tokens is rejected.
4. **Logout** either a single session (`POST /api/v1/auth/logout`) by presenting its refresh token or **all devices** (`POST /api/v1/auth/logout-all`) using the bearer access token.
5. **Session inventory** and revocation endpoints (`GET /api/v1/auth/sessions`, `POST /api/v1/auth/sessions/revoke/:id`) let users manage their devices explicitly.

Behind the scenes, the service enforces the configured session limit, revokes the oldest active sessions when necessary, and cleans up expired or revoked refresh tokens every 12 hours via a cron job.

## Scripts

```bash
npm run start        # production mode
npm run start:dev    # watch mode
npm run lint         # ESLint with Prettier integration
npm run test         # unit tests via Jest
npm run test:e2e     # end-to-end tests with the in-memory Prisma adapter
npm run openapi:json # export OpenAPI schema to ./openapi/catotel-api.json
```

## API Documentation

Swagger UI is automatically exposed at `/api/docs` (JSON at `/api/docs/schema.json`).  
To publish the schema for client generation, run `npm run openapi:json` which writes `openapi/catotel-api.json`.

### Domain Overview

- **Users & Auth**: JWT-based auth with role claims (`ADMIN`, `MANAGER`, `STAFF`, `CUSTOMER`).
- **Customers** (`/customers`): view/update profile, manage cats, fetch recent reservations.
- **Rooms** (`/rooms`): public listing plus manager/admin CRUD.
- **Reservations** (`/reservations`): customers book rooms for multiple cats, add optional services; staff/admin can query any reservation.
- **Staff Tasks** (`/staff/tasks`): caregivers monitor and close care tasks tied to reservations/cats.
- **Addon Services & Payments**: modelled in Prisma (addons + payments) ready for future endpoints/integrations.

## Testing

The repository includes lightweight Jest specs to ensure modules can be instantiated, plus a realistic e2e flow (`test/app.e2e-spec.ts`) that drives the authentication lifecycle through HTTP. The e2e suite replaces Prisma with an in-memory adapter (`test/utils/in-memory-prisma.service.ts`), so it runs deterministically without touching your real database. Because validation pipes reject malformed DTOs, prefer testing both success and failure scenarios for auth-critical endpoints.

## Contributing

1. Fork and clone the repo.
2. Create a feature branch (`git checkout -b feature/amazing`).
3. Commit, push, and open a pull request describing the change and any new environment requirements.

## License

This project inherits the NestJS MIT license. See `LICENSE` for details.
