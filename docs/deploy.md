# Deploy rehberi

Bu belge, Catotel API + Dashboard üretim Docker imajlarını nasıl oluşturacağınızı, `docker-compose.yml` ile tam yığını nasıl ayağa kaldıracağınızı ve hangi ortam değişkenlerinin nerede kullanıldığını anlatır.

## Docker imajları

Reponun kökünde iki Dockerfile bulunur:

| Servis | Dockerfile | Açıklama |
| --- | --- | --- |
| API (NestJS + Prisma) | `catotel-api/Dockerfile` | Çok aşamalı build, pnpm workspace bağımlılıklarını çözer, `pnpm --filter catotel-api build` + `prisma generate` çalıştırır ve container start'ında `prisma migrate deploy` + `start:prod` komutlarını tetikler. Varsayılan port `3000`. |
| Dashboard (Next.js 14 App Router) | `catotel-dashboard/Dockerfile` | pnpm workspace üzerinden dashboard ve paylaşılan paketleri kurar, `next build` sonrasında `next start` çalıştırır. Varsayılan port `3100`. |

İmajların her biri root context ile (workspace bilgisi kaybolmadan) build edilir:

```bash
# Sadece API
docker build -f catotel-api/Dockerfile -t catotel/api .

# Sadece Dashboard
docker build -f catotel-dashboard/Dockerfile -t catotel/dashboard .
```

API imajı PostgreSQL'e bağlanmak için `DATABASE_URL` bekler; container ilk açılışta migration çalıştırır. Dashboard imajı, API proxy hedefini `API_BASE_URL` üzerinden alır (örn. `http://api:3000/api/v1`).

## docker-compose ile full stack

Kök `docker-compose.yml`, Postgres + API + Dashboard servislerini tek komutla ayağa kaldırır. Varsayılan değerler `.env` dosyası yaratmadan çalışır, ancak deployment'ta gerçek secret'ları `.env` aracılığıyla geçirmeniz gerekir.

```bash
# ilk kurulum: gerekli secretları .env dosyasına yazın
cat <<'EOF' > .env
POSTGRES_USER=catotel
POSTGRES_PASSWORD=super-secret
ACCESS_TOKEN_SECRET=prod-access-secret
REFRESH_TOKEN_SECRET=prod-refresh-secret
MAIL_FROM=Catotel <noreply@catotel.dev>
EOF

# imajları build edip yığını ayağa kaldırın
docker compose up --build -d

# logları izleyin
docker compose logs -f api
docker compose logs -f dashboard

# işleri durdurmak için
docker compose down -v
```

Compose servisleri:

- `postgres`: `postgres:15-alpine`, verileri `postgres-data` volume'ünde saklar.
- `api`: `catotel-api/Dockerfile`'dan build edilir, `3000` portunu host'a map eder ve container start'ında migrasyon + serveri çalıştırır.
- `dashboard`: `catotel-dashboard/Dockerfile`'dan build edilir, `3100` portunu host'a map eder ve API istekerini `http://api:3000/api/v1` adresine proxyler.

Mobil Expo istemcisi container'a dahil değildir; cihaz ya da Expo Go uygulamasında `EXPO_PUBLIC_API_BASE_URL=https://<public-api>/api/v1` değeri verilerek aynı backend'e bağlanabilir.

## Ortam değişkenleri matrisi

Aşağıdaki tablo Compose veya CI/CD pipeline'ında doldurmanız gereken kritik değişkenleri özetler. Varsayılan değerler lokal geliştirme içindir; production’da secret değerleri kullandığınızdan emin olun.

| Servis | Değişken | Varsayılan/Örnek | Açıklama |
| --- | --- | --- | --- |
| Postgres | `POSTGRES_DB` | `catotel` | Oluşturulacak veritabanı adı. |
| Postgres | `POSTGRES_USER` | `catotel` | Veritabanı kullanıcısı; `DATABASE_URL` içinde de kullanılır. |
| Postgres | `POSTGRES_PASSWORD` | `catotel` | Veritabanı kullanıcısı şifresi. |
| API | `PORT` | `3000` | HTTP portu; Compose host portunu da buna göre map eder. |
| API | `DATABASE_URL` | `postgresql://catotel:catotel@postgres:5432/catotel` | Prisma/Postgres bağlantısı. Compose otomatik olarak `postgres` servisini adresler. |
| API | `CORS_ORIGINS` | `http://localhost:3100` | Virgülle ayrılmış izinli origin listesi; dashboard domain'inizi ekleyin. |
| API | `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | `change-me-*` | JWT imzaları için HMAC secret'ları. Production’da rastgele 32+ byte seçin. |
| API | `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | `15m` / `7d` | Token yaşam süresi. |
| API | `JWT_ISSUER` / `JWT_AUDIENCE` | `catotel-api` / `catotel-client` | JWT metadata alanları; istemci doğrulamasıyla eşleşmeli. |
| API | `MAX_SESSIONS_PER_USER` | `3` | Aynı anda açılabilecek cihaz/refresh token limiti. |
| API | `RATE_LIMIT_TTL` / `RATE_LIMIT_LIMIT` | `60` / `120` | Global rate-limit penceresi (saniye) ve istek limiti. |
| API | `MAIL_ENABLED` | `false` | SMTP gönderimini açmak için `true`. |
| API | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` | `smtp.mailtrap.io`, `587`, `false`, `-`, `-`, `Catotel <noreply@catotel.dev>` | Şifre sıfırlama e-postaları için gerekli değerler. Production'da doğrulanmış domain kullanın. |
| API | `PASSWORD_RESET_URL` | `http://localhost:3100/auth/reset-password` | Dashboard üzerindeki reset formu. |
| API | `PASSWORD_RESET_TOKEN_TTL_MINUTES` | `30` | Reset token yaşam süresi. |
| API | `PASSWORD_RESET_EMAIL_WINDOW_MINUTES` / `PASSWORD_RESET_EMAIL_MAX_PER_WINDOW` | `15` / `3` | E-posta rate-limit ayarları. |
| Dashboard | `PORT` | `3100` | `next start` portu. |
| Dashboard | `API_BASE_URL` | `http://api:3000/api/v1` | Server-side proxy hedefi; Compose içinde API servisine işaret eder. Production’da load balancer/ingress adresini kullanın. |
| Dashboard | `NEXT_PUBLIC_API_BASE_URL` | *(boş)* | Tarayıcının doğrudan backend'le konuşması gereken senaryolarda doldurun, aksi halde boş bırakın. |
| Dashboard | `NODE_ENV` | `production` | Build optimizasyonu için. |
| Mobile | `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:3000/api/v1` | Expo uygulamasının bağlanacağı backend adresi. Production build'lerde HTTPS zorunludur (`src/lib/env.ts`). |

> İpucu: `.env` dosyasını Compose ile paylaşırken mobil istemciye aynı değerleri `.env`/CI secret olarak verin ki access/refresh token akışları eşleşsin.

## CI/CD notları

- Container Registry'ye push etmeden önce `docker buildx bake` ya da benzeri bir multi-platform build süreci kurabilirsiniz; Dockerfile'lar `node:20-alpine` tabanlı olduğu için AMD64 + ARM64 üzerinde sorunsuz çalışır.
- Production rollout sırasında:
  1. Postgres container hazır olduğunda `api` servisi otomatik migrate eder.
  2. `dashboard` container'ı `API_BASE_URL` üzerinden API'ye proxy yapar; load balancer'da `/dashboard` rotasını 3100 portuna yönlendirmek yeterli.
  3. Mobil istemciyi güncellerken yeni backend host'unu `EXPO_PUBLIC_API_BASE_URL` olarak ayarlayın.
- Log toplamak için `docker compose logs -f api dashboard` kullanabilir ya da her container'a ayrı log driver atayabilirsiniz.
