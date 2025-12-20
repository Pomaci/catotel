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
- Lokal log/test artefaktlari ile scratch dosyalari icin standard surec `docs/dev-artifacts.md` dosyasinda belirlendi; loglar `logs/` altinda, gecici notlar `scratch/` altinda kalmali.
- E2E senaryolari icin `.github/workflows/e2e.yml` dosyasi PostgreSQL servisi kurar, API'yi build eder ve dashboard Playwright testlerini calistirir. Opsiyonel Detox iOS isi `workflow_dispatch` ile tetiklenir.
- Yerel Redis dump'lari (`catotel-infra-check/redisdata`) versiyon kontrolune girmeyecek; ihtiyac varsa ayri bir backup olarak saklayin.

## MVP kapsami
- **Rezervasyon cekirdegi**: musteriler, kediler, oda tipleri, rezervasyon olusturma/düzenleme, oda atama ve multi-cat fiyatlandirma invariants'lari (bkz. `docs/domain-rules.md` & `docs/data-model.md`).
- **Auth & session yönetimi**: JWT access/refresh, HttpOnly cookie + CSRF proxy modeli, mobil bearer akisi, `MAX_SESSIONS_PER_USER` limitleri ve self-service oturum kapatma aksiyonlari (`docs/security-model.md`, `docs/errors-i18n.md`).
- **Dashboard/Mobil parity**: Cats/Rooms/Reservations/Tasks kartlari, session listesi ve token aksiyonlarini hem web hem mobilde ayni API client uzerinden saglama.

## Roadmap (sadece özet)
1. **Ödeme entegrasyonu**: Su an `Payment` modeli stub halinde; Stripe/iyzico gibi saglayicilara dogrudan baglanip kart tokenizasyonu, webhook'lar ve `PaymentStatus` transition'lari icin servis katmani yazilacak. Dashboard'da ödeme loglari ve refund akisi UI'ya baglanacak.
2. **Personel görev akislari**: `CareTask` modeli dashboard kartlarinda listeleniyor fakat status otomasyonu ve bildirimler eksik. V1'de:
   - Görev queue'su + SLA uyarilari,
   - Mobil push bildirimleri,
   - Çift imza gerektiren CHECKIN/CHECKOUT formlarinin task workflow'una baglanmasi.
3. **Musteri self-service**: Musteri portalinin (dashboard uzerinde sinirli rol) rezervasyon talebi, kedi profili güncelleme ve ödeme dekontu indirme gibi fonksiyonlari acilacak. MFA + email verification eklenerek production rollout hazirlanacak.
4. **Operational analytics** (stretch): Oda doluluk raporlari, overbooking alert'leri, gelir/kedi başi metrikler icin read-model ve chart'lar eklenecek.

## Lisans
Bu monorepo'daki tum paketler MIT Lisansi altinda yayinlanir. Ayrintilar icin `LICENSE` dosyasina bakin.
