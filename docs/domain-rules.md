# Domain kurallari

Bu dokuman, Catotel icin kritik operasyonel kurallar kalici olarak yazilsin diye hazirlandi. Gelistirme ve urun ekipleri ayni kaynak uzerinden hareket etmelidir.

## Check-in/out semantigi
- `checkIn` ve `checkOut` alanlari otel gunu kavramiyla calisir; sadece tarih tutulur ve backend bu tarihleri UTC gece 00:00 olarak normalize eder. Gercek varis/ayrilis saatleri `checkInForm.arrivalTime` ve `checkOutForm.departureTime` alanlarinda saklanir; form saatleri yoksa durum degisimi anindaki `now()` degeri `checkedInAt`/`checkedOutAt` olarak yazilir.
- Her iki tarih de zorunludur, `checkIn < checkOut` olma zorunlulugu API seviyesinde dogrulanir.
- Musteri bekleyen rezervasyonlarda (`PENDING` veya `CONFIRMED`) check-in tarihi bugunun daha gerisinde olamaz. Tek istisna, rezervasyonu ayni istekte `CHECKED_IN` durumuna tasimak (geri tarihli check-in) ya da daha once check-in olup `CONFIRMED` durumuna geri cekiyorsaniz saglanir.
- Durum akisi `PENDING -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT -> CANCELLED` seklindedir. Sistem en fazla bir adim geri gitmeye izin verir (ornegin hatali check-out sonrasi tekrar `CHECKED_IN`). `CANCELLED` durumuna her zaman dogrudan gecilebilir; iptali geri almak sadece `PENDING` veya `CONFIRMED` durumlarina donusle sinirlidir.
- Rezervasyon `CHECKED_IN` oldugu anda oda atamasi kilitlenir (`lockedAt`), boylece yeniden dengeleme islemleri misafiri baska odaya tasimaz. `CHECKED_OUT` veya `CANCELLED` olan atamalar silinerek envanter bosaltilir.

## Room sharing
- `allowRoomSharing` varsayilan olarak `true` gelir. Deger `true` ise her kedi icin bir slot harcanir; `false` oldugunda oda tipinin tum kapasitesi tek rezervasyona ayrilir ve ayni oda periyodu icin baska rezervasyon planlanamaz.
- Slot hesabinda rezervasyonun `reservedSlots` degeri oncelikli kullanilir; yoksa paylasim devre disiysa tum kapasite, paylasim aciksa da kedi sayisi kadar slot bloke edilir.
- Dengeleyici servis, paylasimsiz (`allowRoomSharing=false`) rezervasyonlari oncelikli ele alir ve bu rezervasyonlar var olan tum cakisan slotlar icin diger atamalari reddeder.
- Paylasimli rezervasyonlar ayni musterinin cakisan konaklamalari varsa ayni oda tercihini koruyacak sekilde onceliklendirilir; kalan bos kapasiteye gore minimum israf yapan oda secilir. Ayni oda icinde cakisan paylasimli rezervasyonlarin toplam kedi sayisi oda kapasitesini hicbir zaman asamaz.

## Overbooking sinirlari
- Her oda tipinde fiziksel oda sayisinin uzerine satisa izin veren `overbookingLimit` alani bulunur. Deger oda bazinda calisir (kedi slotu bazinda degil) ve negatif olamaz; API `Math.max(0, limit)` ile guvenceye alir.
- Toplam satilabilir slot sayisi `(aktif oda adedi + overbookingLimit) * kapasite` formuluyle hesaplanir. Bu toplamdan, cakisan ve paylasim durumuna gore hesaplanan `reservedSlots` miktari dusulur; kalan slotlar sifirin altina inmez.
- Overbooking sayesinde kapasite dolmadan once sinirli sayida ekstra rezervasyon alinir, ancak fiziksel oda acigi oldugunda operasyonun misafirleri diger oda tipi ya da ortak alanlara kaydirma planini manuel yapmasi gerekir. Check-in gerceklesip oda kilitlendiginde overbooking de devreden cikar; iptal/cikis aninda yeniden dagitim yapilir.
- Limit artirildiginda yeni rezervasyonlar icin `assertRoomTypeAvailability` dogrulamasi hemen guncel toplam slotu kullanir; daha once alinmis rezervasyonlar otomatik yeniden dagitilir.

## Iptal ve iadeler
- `ReservationStatus.CANCELLED` durumuna gecen tum rezervasyonlar oda atamasindan temizlenir, boylece inventory aninda bosalir. Iptal edilen rezervasyon tekrar aktive edilecekse status yalnizca `PENDING` ya da `CONFIRMED` konumuna cekilebilir; daha ileri durumlara (or. dogrudan `CHECKED_IN`) ziplamaya izin verilmez.
- Odeme kayitlari `Payment` tablosunda tutulur; her kayit `amount`, `method`, `status` ve opsiyonel `transactionRef` alanlarina sahiptir. `PaymentStatus` degerleri `PENDING`, `PAID`, `FAILED`, `REFUNDED` dizisidir.
- Bir odeme kaydinin durumu `PAID`, `FAILED` veya `REFUNDED` olarak guncellendiginde sistem otomatik olarak `processedAt` damgasi yazar; `PENDING` durumuna donen kaydin `processedAt` degeri tekrar `null` olur. Boylece iptal surecinde hangi iadelerin tamamlandigi izlenebilir.
- Iptal sonrasi iade gerekiyorsa ilgili `Payment` satirinin `status` alanini `REFUNDED` yapip banka referansini `transactionRef` alaninda saklamak standarttir. Odeme hic alinmadiysa (`PENDING`) kaydi `FAILED` durumuna almak yeterlidir.

## Indirimlerin uygulanma sirasi
- Temel fiyat `nightlyRate` degerinden hesaplanir. Paylasimli rezervasyonlarda gece bazli rakam, oda kapasitesi yerine kedi basina dusen slot sayisina gore `perCatRate` kullanilarak belirlenir; paylasim kapaliysa tum kapasite fiyatlanir. Add-on servisleri bu baz toplama sonradan eklenir.
- Indirimler yalnizca fiyatlandirmadaki ayar aciksa devreye girer ve hepsi ayni baz tutar (`baseTotal`) uzerinden hesaplanarak toplama eklenir:
  1. **Cok kedili indirim**: `catCount` degerini asan en yuksek kademe secilir ve ilgili yuzdelik uygulanan ilk indirimi olusturur.
  2. **Paylasimli oda indirimi**: Sadece `allowRoomSharing=true` olan rezervasyonlarda ve belirlenen `remainingCapacity` esigini saglayan kademelerde calisir.
  3. **Uzun konaklama indirimi**: `nights` sayisi her kademe icin minimum gece kosulunu karsiliyorsa son uygun kademe kullanilir.
- Indirimler zincirleme carpimla degil toplamsal olarak hesaplanir; yani her biri `baseTotal * (percent/100)` formuluyle bulunur ve bir onceki indirimin dusurulmus tutari yerine ayni baz uzerinden toplanir. Son tutar sifirin altina dusurse 0'a kirpilir.
