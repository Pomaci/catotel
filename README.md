# Catotel monorepo

Catotel backend, Next.js dashboard, Expo mobil uygulama ve OpenAPI tabanli JS/TS istemci ayni depoda toplandi. Her proje kendi README dosyasina sahip; burada sadece giris ve hizli komutlar var.

## Klasor yapisi
- `catotel-api/` - NestJS + Prisma API (PostgreSQL). Ayrintilar: `catotel-api/README.md`.
- `catotel-dashboard/` - Next.js 14 panel, proxy ile API'ye baglanir. Ayrintilar: `catotel-dashboard/README.md`.
- `catotel-mobile/` - Expo uygulamasi, dashboard akislariyla uyumlu. Ayrintilar: `catotel-mobile/README.md`.
- `catotel-clients/api-client/` - OpenAPI'den uretilebilir fetch tabanli istemci (`npm run generate && npm run build`).
- `catotel-infra-check/redisdata/` - Lokal Redis dump'i; git tarafinda ignore edildi.
- `.github/workflows/e2e.yml` - Playwright e2e (API + dashboard) ve opsiyonel Detox iOS kosar.

## Hizli baslangic
Node 20 ile calismak en guvenli secim (GitHub Actions da aynisini kullanir).

### API (localhost:3000)
```bash
cd catotel-api
npm install
cp .env.example .env   # gizli degerleri doldur
npx prisma generate
npm run start:dev
```

### Dashboard (localhost:3100)
```bash
cd catotel-dashboard
npm install
API_BASE_URL=http://localhost:3000/api/v1 npm run dev
# Only set NEXT_PUBLIC_API_BASE_URL if the browser should call the backend directly.
```

### Mobile (Expo)
```bash
cd catotel-mobile
npm install
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 npm run start
```

### OpenAPI istemcisi
```bash
cd catotel-clients/api-client
npm install
npm run generate
npm run build
```

## GitHub'a gonderim adimlari
1. `git init`
2. `git add .`
3. `git commit -m "chore: import catotel monorepo"`
4. `git branch -M main`
5. `git remote add origin <senin-repo-urlin>`
6. `git push -u origin main`

## Dikkat edilmesi gerekenler
- `.env`, `.env.*`, loglar, build klasorleri ve `catotel-infra-check/redisdata/` gitignore'a eklendi; sadece `.env.example` takipte kalir.
- E2E senaryolari icin `.github/workflows/e2e.yml` dosyasi PostgreSQL servisi kurar, API'yi build eder ve dashboard Playwright testlerini calistirir. Opsiyonel Detox iOS isi `workflow_dispatch` ile tetiklenir.
- Yerel Redis dump'lari (`catotel-infra-check/redisdata`) versiyon kontrolune girmeyecek; ihtiyac varsa ayri bir backup olarak saklayin.
