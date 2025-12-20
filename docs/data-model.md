# Data model ozet

Catotel domainindeki ana entity'ler, onlar arasindeki baglar ve uygulamanin sagladigi invariants bu belgede toplandi. Ayrica seed scriptlerinin nasil calistigi anlatilir.

## Ana entity gruplari

- **Kullanicilar & profiller**: `User` tablosu (`catotel-api/prisma/schema.prisma:18`) email + role bazli kimligi tutar. Her musterinin tek `CustomerProfile` kaydi, her staff/admin'in tek `StaffProfile` kaydi vardir. Parola reset token'lari `PasswordResetToken` tablosundadir.
- **Auth & oturumlar**: `Session` (`schema.prisma:38`) refresh token hash'ini, cihaz bilgisini ve `expiresAt` degerini saklar. Auth servisleri bu tabloyu kullanip `MAX_SESSIONS_PER_USER` limitini uygular.
- **Kediler & musteriler**: `Cat` (`schema.prisma:75`) musterinin kedilerini kaydeder; `ReservationCat` join tablosu ayni rezervasyonda birden fazla kediyi baglar.
- **Oda tipleri & fiziksel odalar**: `RoomType` + `Room` (`schema.prisma:101` / `schema.prisma:117`) kapasite, gece ucreti ve `overbookingLimit` bilgilerini saklar. Fiziksel odalar `RoomAssignment` ile rezervasyonlara atanir.
- **Rezervasyon cekirdegi**: `Reservation` (`schema.prisma:142`) musterinin hangi oda tipinde, hangi tarihlerde kalacagini ve durumunu (`ReservationStatus`) tutar. `allowRoomSharing`, `reservedSlots`, `checkIn/checkOut` ve fiyat bilgileri bu tabloda yer alir.
- **Oda atamalari**: `RoomAssignment` + `RoomAssignmentCat` (`schema.prisma:236`) her rezervasyon icin fiziksel oda, kedi listesi ve kilitlenme zamanini saklar; re-balance islemleri bu tablo uzerinden yapilir.
- **Add-on hizmetleri & odemeler**: `AddonService`, `ReservationService` ve `Payment` (`schema.prisma:126`, `schema.prisma:213`, `schema.prisma:225`) ekstralari ve odeme kayitlarini modeller. `Payment` satirlari `PaymentStatus` ile baglantilidir.
- **Care task & loglar**: `CareTask` (`schema.prisma:247`) rezervasyon bazli bakim gorevlerini, `ActivityLog` sistemsel aksiyonlari tutar.
- **Fiyatlandirma ayarlari**: `PricingSettings` (`schema.prisma:278`) multi-cat, shared-room ve uzun konaklama indirim kademelerini JSON alanlarda saklar; servis tarafinda normalize edilip hesaplamada kullanilir.

## Kritik invariants

1. **Check-in/out guvenligi**: Rezervasyon servisleri `checkIn < checkOut` kosulunu saglamayan kayitlari reddeder ve gecmise donuk check-in sadece anlik `CHECKED_IN` guncellemesiyle yapilabilir (`catotel-api/src/reservations/reservations.service.ts:150` ve `catotel-api/src/reservations/reservations.service.ts:430`). Durum gecisleri `isValidTransition` fonksiyonundaki siraya uymak zorundadir (`reservations.service.ts:647`).
2. **Oda kapasitesi & room sharing**: Rezervasyon olusmasi icin secilen `RoomType.capacity` kedi sayisindan kucuk olamaz (`reservations.service.ts:197`). Room sharing aciksa slot sayisi kedi sayisi kadar, kapaliysa oda kapasitesi kadar bloklanir (`reservations.service.ts:211`). `RoomAssignmentService` paylasimsiz rezervasyonlari onceliklendirir ve fiziki oda kapasitesi asilimaz (`catotel-api/src/reservations/room-assignment.service.ts:181` ve `room-assignment.service.ts:282`).
3. **Overbooking limiti**: `RoomType.overbookingLimit` fiziksel oda adedine eklenecek ekstra birim sayisini temsil eder (`schema.prisma:107`). Kapasite hesaplamalari `(aktif oda + limit) * capacity` formuluyle yapilir (`catotel-api/src/room-types/room-types.service.ts:101`).
4. **Token ve CSRF invariants**: Access/refresh token'larin bitis suresi `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL`, max oturum sayisi `MAX_SESSIONS_PER_USER` ile sinirlanir. Her mutasyon `X-CSRF-Token` header'i olmadan reddedilir; bu header dashboard BFF tarafindan otomatik eklenir (`docs/security-model.md:7`).
5. **Fiyatlandirma tutarliligi**: `calculateDiscountAmount` multi-cat, shared-room ve uzun konaklama indirimlerini sirayla uygulayip 0 altina inmeyen toplam doner (`catotel-api/src/reservations/reservations.service.ts:672`). `PricingSettingsService` gelen JSON payloadlarini temizleyip siralar (`catotel-api/src/pricing-settings/pricing-settings.service.ts:104`).
6. **Oda atama kilidi**: Rezervasyon `CHECKED_IN` oldugunda ona ait `RoomAssignment` satirlari kilitlenir (`room-assignment.service.ts:126` + `reservations.service.ts:631`), boylece sonraki re-balance islemleri misafiri tasimaz.
7. **Payment processed damgasi**: `PrismaService` extension'i `Payment.status` `PAID/FAILED/REFUNDED` oldugunda `processedAt` alanini oto-doldurur, `PENDING` durumuna gecince null'lar (`catotel-api/src/prisma/prisma.service.ts:47`).

## Seed akisi

- **E2E/admin seed**: `pnpm --filter catotel-api seed:e2e` komutu `catotel-api/prisma/seed-e2e.ts` dosyasini calistirarak varsayilan ya da `E2E_ADMIN_*` environment'lariyla verilen bilgilerden admin kullanici olusturur. Script bcrypt ile parola hash'ler, upsert yapar ve bitiste Prisma baglantisini kapatir.
- **Test seed'i**: Jest/E2E testleri `catotel-api/test/utils/prisma-test-client.ts` icindeki `prepareTestDatabase()` ve `seedTestData()` fonksiyonlarini kullanir. Bu script SQLite bazli lokal db olusturup admin, customer, iki staff, bir roomType/room, addon service, kedi, rezervasyon ve iki care task kaydi yaratir; testler stabil fixture'lar uzerinden calisir.
- **Manuel lokal seed**: Gerekirse Postgres docker container'i acildiktan sonra `pnpm --filter catotel-api prisma migrate deploy` + `pnpm --filter catotel-api seed:e2e` sirasi izlenebilir. Dashboard ve mobil istemci ayni hostta calistigi surece HttpOnly cookie / bearer akislari otomatik sekilde oturum acar.

Bu model sayesinde API, dashboard ve mobil istemci ayni kontratlarla calisir; invariant'lar servis katmaninda guard'landigi icin veri katmaninda bozuk kayit olusmasi engellenir.
