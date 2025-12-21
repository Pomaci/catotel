# AGENTS.md (Catotel)

Bu dosya, Codex/LLM coding agent'larinin bu repoda hizli, guvenli ve tutarli sekilde calisabilmesi icin proje haritasi + calisma kurallarini icerir.

## Repo ozeti

- Monorepo: pnpm workspace
- Node: 20 (bkz. `.nvmrc`)
- Paket yoneticisi: `pnpm@9.15.4` (bkz. root `package.json`)
- Ana paketler:
  - `catotel-api/` - NestJS 11 + Prisma (PostgreSQL), `/api/v1`
  - `catotel-dashboard/` - Next.js 14 (App Router) dashboard + BFF proxy
  - `catotel-mobile/` - Expo (Expo Router) mobil uygulama
  - `catotel-clients/` - paylasilan TS paketleri:
    - `catotel-clients/contracts` (`@catotel/contracts`)
    - `catotel-clients/i18n` (`@catotel/i18n`)
    - `catotel-clients/api-client` (`@catotel/api-client`, OpenAPI'den uretilir)
- Not: Repo kokundeki `app/` dizini legacy/deneysel gorunuyor; aktif dashboard `catotel-dashboard/` altindadir.

## Hizli komutlar (repo koku)

- Kurulum: `pnpm install`
- Tum servisler (dev): `pnpm dev` (API: `3000`, Dashboard: `3100`, Expo: Metro)
- Tek servis:
  - API: `pnpm dev:api`
  - Dashboard: `pnpm dev:dashboard`
  - Mobile: `pnpm dev:mobile`
- Kalite kapilari:
  - Lint: `pnpm lint`
  - Test: `pnpm test`
  - Build: `pnpm build`
- Paket filtreleme: `pnpm --filter <paket-adi> run <script>`

Tercih: Workspace linklemeyi korumak icin mumkunse npm yerine pnpm kullan.

## Mimari harita (kisa)

### API (`catotel-api/`)

- Entry: `catotel-api/src/main.ts` (global prefix `/api`, URI versioning `/api/v1`)
- DB: Prisma + Postgres
  - Schema: `catotel-api/prisma/schema.prisma`
  - Migrations: `catotel-api/prisma/migrations/`
  - Env: `catotel-api/.env.example` -> `catotel-api/.env`
- Swagger/OpenAPI:
  - JSON uretimi: `pnpm --filter catotel-api run openapi:json`
  - Cikti: `catotel-api/openapi/catotel-api.json`
- Domain notlari (degisiklik yapmadan once oku):
  - `docs/domain-rules.md` (check-in/out, room sharing, overbooking, payment)
  - `docs/data-model.md` (tablo/servis referanslari)

Guvenlik notu:

- Backend, state degistiren isteklerde `X-CSRF-Token` bekler (dashboard proxy ve mobil client bunu saglar). Browser'dan backend'e direkt gidiyorsan CSRF + CORS basliklarini gozet.

### Dashboard (`catotel-dashboard/`)

- Next.js 14 (App Router)
- Dev port: `3100` (`catotel-dashboard/package.json#scripts.dev`)
- Prod port: default `3000` (`next start`, CI/E2E bunun uzerinden kosar)
- BFF proxy route'lari: `catotel-dashboard/app/api/**`
  - Auth cookie + CSRF zinciri buradan yonetilir (ornegin `catotel-dashboard/app/api/auth/**`).
- Auth guard: `catotel-dashboard/middleware.ts` (`/dashboard` korumasi ve CSRF bootstrap)
- E2E: Playwright
  - Config: `catotel-dashboard/playwright.config.ts`
  - Testler: `catotel-dashboard/tests/e2e`
  - baseURL default `http://localhost:3000`; dev server icin `E2E_BASE_URL=http://localhost:3100` ver.

### Mobile (`catotel-mobile/`)

- Expo Router (dosya tabanli routing): `catotel-mobile/app/**`
- Auth: bearer + refresh; tokenlar `expo-secure-store`
  - Baslangic: `catotel-mobile/src/context/AuthContext.tsx`
- Env: `EXPO_PUBLIC_API_BASE_URL` (default `http://localhost:3000/api/v1`)

### Shared packages (`catotel-clients/`)

- `@catotel/contracts` - paylasilan tipler/enums (backend + web + mobile)
- `@catotel/i18n` - error katalogu + localized message helper'lari (bkz `docs/errors-i18n.md`)
- `@catotel/api-client` - OpenAPI'den uretilen fetch client
  - Elle duzenleme yapma: `catotel-clients/api-client/src/generated/**`

## Degisiklik akislar (agent checklist)

### 1) API endpoint/DTO/contract degisikligi

1. Degisikligi `catotel-api/` icinde yap.
2. OpenAPI guncelle: `pnpm --filter catotel-api run openapi:json`.
3. Client'i yeniden uret: `pnpm --filter @catotel/api-client run generate && pnpm --filter @catotel/api-client run build`.
4. Dashboard/mobile tuketimini guncelle.
5. Lint/typecheck/test calistir (en azindan ilgili paket filtreleriyle).
6. OpenAPI'de breaking change varsa `.changeset/` ile major bump beklenir (bkz `tooling/scripts/check-openapi-breaking-change.mjs`).

### 2) Yeni i18n hata kodu / error handling

1. `catotel-clients/i18n/src/` altinda katalogu guncelle.
2. Backend'de `localizedError(...)` / `buildLocalizedMessage(...)` kullan.
3. Istemcilerde `localizedMessage` varsa onu goster, yoksa `message` fallback yap (bkz `docs/errors-i18n.md`).

### 3) Rezervasyon/oda atama davranisi degisikligi

- Once `docs/domain-rules.md` ve `docs/data-model.md` ile uyumu kontrol et.
- Check-in sonrasi oda atamasi "kilitlenir" (lockedAt). Bu kurali bozmadan ilerle.

## Kod stili ve kalite

- Format: `prettier.config.mjs` (singleQuote, trailingComma=all, printWidth=100)
- ESLint: Flat config
  - Paketlerde `eslint.config.mjs` -> `tooling/eslint/*`
- TypeScript: strict acik (`noImplicitAny: true`).
- Yeni kodlarda best practice uygulamalarini kullan.
- UI/UX degisikliklerinde tasarimlar birbiriyle uyumlu ve tamamen modern olmali.

## Repo hijyeni (log/scratch)

- Lokal loglar: repo kokunde `logs/` altinda tut (ornegin `logs/api`, `logs/dashboard`).
- Gecici dosyalar: `scratch/` altinda tut.
- Detaylar: `docs/dev-artifacts.md`.

## Windows/PowerShell ipuclari

- Klasor adinda `[` `]` olan path'ler (ornegin `catotel-dashboard/app/dashboard/reservations/[id]/page.tsx`) icin PowerShell'de okuma/yazmada `-LiteralPath` kullan.

## Ne yapmamali

- `dist/`, `src/generated/` gibi uretilen ciktilari elle duzenleme.
- `.env` / gizli degerleri repoya ekleme.
- Buyuk refactor'lar: talep yoksa kucuk ve hedefli degisiklik yap.
