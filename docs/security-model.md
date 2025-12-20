# Security model

Bu dokuman Catotel web dashboard'u ile Expo mobil istemcisinin auth mimarisini yan yana anlatir. Her iki istemci de ayni NestJS API'yi kullanir, ancak token tasima ve saklama stratejileri farklidir.

## Ortak temel
- API `POST /api/v1/auth/login` cevabinda **15 dakikalik access token** ve **7 gunluk refresh token** dondurur. Refresh token'lar veritabaninda hash'lenir ve `MAX_SESSIONS_PER_USER` limiti (varsayilan 3) devrededir.
- `POST /api/v1/auth/refresh` cagrisi hem access hem refresh token'i atomik olarak rotasyona sokar. Eski refresh token tekrar kullanilirsa oturum reddedilir.
- `POST /api/v1/auth/logout` yalnizca sunulan refresh token'i kapatir, `POST /api/v1/auth/logout-all` bearer access token ile cagrilip tum oturumlari iptal eder.
- Tum state degistiren istekler icin backend `X-CSRF-Token` header'ini bekler (aksi halde 403). Mobil istemci bu header'i refresh token'dan urettigi CSRF degeriyle doldurur; dashboard BFF bunu otomatik ekler.

## Dashboard BFF (HttpOnly cookie + CSRF)
- Next.js 14 app router altindaki `/api/auth/*` route'lari API'ye server-side proxy gorevi gorur. Login/register/refresh/logout istekleri backend'e aktarilir, donen JWT'ler `HttpOnly`, `Secure`, `SameSite=Lax` cookie'lere yazilir. Tarayici JS katmani token'lari hic gormez.
- BFF ayni zamanda `/api/auth/csrf` uzerinden double-submit CSRF token'i uretir; token refresh cookie'sinden derive edilen deger ayrica `X-CSRF-Token` olarak istemciye verilir. React Query tabanli `clientRequest` helper'i butun POST/PUT/PATCH/DELETE cagrisina bu header'i ekler.
- Dashboard sadece `API_BASE_URL` ile backend'e (default `http://localhost:3000/api/v1`) server-side baglanir; `NEXT_PUBLIC_API_BASE_URL` yalnizca frontend'in dogrudan backend'e gitmesi gerektiğinde set edilir. Bu senaryoda da HttpOnly cookie + CSRF zinciri korunur.
- `middleware.ts` `/dashboard` altini korur, anonim kullanicilari login'e yonlendirir ve login olanlari public sayfadan cikartir. BFF cookie'leri Next middleware'inde dogrulanir, gecerli degilse otomatik logout olur.

## Mobil uygulama (Bearer + refresh)
- Expo istemcisi (`catotel-mobile`) token'lari cihazin `expo-secure-store` alaninda saklar. Web fallback'i icin `localStorage` kullanilir, ama bu sadece Expo web build'i icin gecerlidir.
- `AuthContext` access token'i memory'de tutar ve `Authorization: Bearer <token>` header'i ile tum API cagrisina ekler. Token suresi 15 dakikayi gectiginde context otomatik `refresh()` cagrisi yapar; refresh token secure-store'dan okunur, yenisiyle degistirilir.
- Mobil istemci CSRF korumasi icin backend'in verdigi double-submit degerini secure-store'da refresh token ile birlikte saklar ve her mutasyon isteginde `X-CSRF-Token` olarak yollar.
- Logout islemleri (tek oturum veya tum oturumlar) secure-store'daki token'lari temizler ve `AuthContext` state'ini resetler. Kullanici tekrar login olana kadar hicbir bearer header'i gonderilmez.
- Expo Router ile calisan ekranlar `useDashboardData` hook'u sayesinde tum modul state'ini yeniler; hook, token rotasyonu bittiginde otomatik yeniden fetch eder. Boylece refresh sirasinda gonderilen gecikmeli istekler 401 alsa bile context tekrar authentication saglar.

## Neden iki farkli model?
- Dashboard kullanici arayuzu tarayicida calistigi icin JWT'leri JS katmanindan uzak tutmak gerekiyor; bu yuzden BFF cookie modeli secildi. HttpOnly cookie + double-submit CSRF, XSS/CSRF riskini minimuma indirir ve backend'e sadece proxy uzerinden erisimi zorlar.
- Mobil istemci ise native baglamda calistigindan cookie yok; bearer + refresh akisi `expo-secure-store` ile birlikte native keychain/keystore guvenligi sagliyor. Ayrica mobil istemci push bildirimleri ve offline senaryolar icin dogrudan API'ye yetkili cagri yapabilmeli.
- Iki istemci de ayni oturum limitlerine ve refresh rotasyonuna tabidir, bu da `POST /api/v1/auth/sessions` yanitindaki cihaz listesi uzerinden izlenebilir. Kullanici dashboard'tan "Tum Oturumlari Kapat" dediginde mobil uygulama da otomatik 401 alir ve tekrar login ister.
