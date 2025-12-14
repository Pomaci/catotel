## Catotel Dashboard

Catotel Command Center is a Next.js 14 app that fronts the Catotel backend through secure App Router proxy routes. Every web + mobile surface shares the same OpenAPI client (`@catotel/api-client`), so the dashboard can drive real reservations, rooms, cats, and staff tasks without duplicating contracts.

### Features

- **Role-aware operations hub** — `AuthContext` issues HttpOnly cookies via internal `/api/auth/*` handlers, while React Query hooks (`useHotelData`) surface customer profiles, cats, rooms, reservations, and staff care tasks with full typing from the shared client package.
- **Modern dashboard modules** — Overview (customer form), Cats, Rooms, Reservations, Tasks, and Security sections render gradient cards, handle loading/error states, and trigger CSRF-protected mutations such as profile updates, cat CRUD, reservation creation, and task status changes.
- **Admin kullanıcı yönetimi** — Admin rolündeki kullanıcılar, yeni personel/manager/admin hesapları oluşturabilir, mevcut kullanıcıların rollerini değiştirebilir ve müşteri/personel profili durumlarını tek tablo üzerinden izleyebilir.
- **Security center** — Security sekmesi “Token Yenile”, “Çıkış Yap”, ve “Tüm Oturumları Kapat” aksiyonlarını proxy üzerinden backend’e iletir ve aktif oturum listesini gösterir.
- **Typed data + caching** — React Query provides optimistic revalidation and cache invalidation, while helper hooks automatically re-fetch affected queries after every mutation.
- **E2E confidence** — Playwright scripts cover registration/login/negative auth flows and assert the presence of the new dashboard panes; Detox scaffolding is prepared for the mobile client once a staging backend is wired.

### Secure Cookie Model

- `/api/auth/login` and `/api/auth/register` persist access/refresh tokens as **HttpOnly**, `SameSite=Lax`, `Secure` cookies so JS never sees raw secrets.
- `/api/auth/refresh` rotates tokens via the proxy and immediately reloads the authenticated profile.
- `/api/auth/logout` and `/api/auth/logout-all` notify the backend and clear cookies locally.
- `middleware.ts` protects `/dashboard` (redirects anonymous users) and keeps authenticated users away from `/`.
- `/api/auth/csrf` issues a double-submit CSRF token derived from the user's refresh token/CSRF secret; the shared `clientRequest` helper injects `X-CSRF-Token` for every mutating call and state-changing routes reject missing/invalid tokens.
- If you call the backend directly from a browser (bypassing this proxy), ensure your origin is whitelisted and send `X-CSRF-Token`; backend CORS now allows that header for CSRF-protected endpoints.

### Development

```bash
npm install
npm run dev
```

The dev server binds to `http://localhost:3100` and expects the backend at `http://localhost:3000`.
Override the proxy target with the server-only `API_BASE_URL` (defaults to `http://localhost:3000/api/v1`). Only set `NEXT_PUBLIC_API_BASE_URL` when you intentionally call the backend directly from the browser.

```bash
# E2E (requires the backend + dashboard to be running)
E2E_BASE_URL=http://localhost:3100 npm run test:e2e:web
```

### Admin hesapları

Self-service kayıtlar her zaman `CUSTOMER` rolü ile açılır. İlk admin hesabını başlatmak için en hızlı yol, veritabanında ilgili kullanıcının rolünü güncellemektir:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ilk.admin@mail.com';
```

Sonrasında dashboard'ta giriş yapan admin kullanıcı, **Kullanıcı Yönetimi** bölümünden yeni staff/manager/admin hesapları oluşturabilir ve mevcut roller üzerinde değişiklik yapabilir.
