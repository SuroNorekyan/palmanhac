## Deployment Notes (Vercel + Railway)

This app deploys cleanly to Vercel using a managed PostgreSQL database on Railway. Provision the database first, then wire the same connection string into Vercel `DATABASE_URL` for all environments (preview/prod) so Prisma can connect at build and runtime.

### 1. Database (Railway Postgres)

| Variable       | Value Source / Format                                                    | Notes                                                          |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `DATABASE_URL` | Railway → Connect → PostgreSQL connection string with `?sslmode=require` | Required at build/runtime; Prisma refuses to start without it. |

After promoting a migration, run `scripts/postdeploy.sh` (see below) with `DATABASE_URL` pointing at production to apply migrations + seed data.

### 2. Auth & NextAuth

| Variable                                    | Purpose                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `AUTH_SECRET` (or `NEXTAUTH_SECRET`)        | 32+ char secret for session encryption. Keep the same between preview/prod.             |
| `NEXTAUTH_URL`                              | Fully qualified URL for each Vercel environment (e.g., `https://palmanhac.vercel.app`). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional OAuth login; configure only if Google sign-in is enabled.                      |
| `ADMIN_EMAIL`                               | Destination for operational emails (orders, payment confirmations).                     |
| `EMAIL_FROM`                                | Verified sender (e.g., `Palmanhac <no-reply@palmanhac.com>`).                           |

### 3. SMTP (transactional email)

| Variable                  | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `SMTP_HOST`               | Mail host (e.g., smtp.eu.mailprovider.com).                                  |
| `SMTP_PORT`               | Typically `587` (STARTTLS) or `465` (SMTPS).                                 |
| `SMTP_USER` / `SMTP_PASS` | Credentials for the SMTP account. Leave blank only if server allows IP auth. |

### 4. EuPago configuration (set separately for live vs. sandbox)

| Variable                       | Production (Live)                       | Preview/Sandbox                               | Notes                                                               |
| ------------------------------ | --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `EUPAGO_API_BASE`              | `https://clientes.eupago.pt`            | `https://sandbox.eupago.pt`                   | No trailing `/api`; library normalizes path segments automatically. |
| `EUPAGO_API_KEY`               | Live API key from EuPago backoffice.    | Sandbox API key from EuPago sandbox.          | Keep keys scoped per environment.                                   |
| `EUPAGO_CARD_RETURN_URL`       | `https://palmanhac.vercel.app/orders`   | `https://palmanhac-preview.vercel.app/orders` | Must match EuPago dashboard allowlist.                              |
| `EUPAGO_WEBHOOK_SHARED_SECRET` | Secret from EuPago Webhooks 2.0 (live). | Secret from sandbox webhook config.           | Use different secrets per env.                                      |

> Tip: In Vercel, create two environment groups (Production vs. Preview/Development) so you can store both EuPago stacks safely.

### 5. Post-deployment workflow

Run `scripts/postdeploy.sh` any time production schema/data needs to sync:

```bash
DATABASE_URL="postgresql://user:pass@railway-host/db?sslmode=require" \
  bash scripts/postdeploy.sh
```

The script executes `pnpm prisma migrate deploy` followed by `pnpm tsx lib/data/seed.ts`, ensuring the database is migrated and seeded without relying on local state.
