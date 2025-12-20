# Hata formati & i18n stratejisi

Web dashboard ile mobil istemcinin ayni sekilde yorumlayabilecegi ortak bir hata/gozlem modeli var. Bu dokuman backend'in yolladigi payload'i, `@catotel/i18n` paketinin nasil kullanilacagini ve istemci tarafindaki beklenen davranisi anlatir.

## API hata JSON'u

`GlobalHttpExceptionFilter` (`catotel-api/src/common/filters/http-exception.filter.ts:18`) tum hatalari yakalar ve su seklinde normalize eder:

```json
{
  "statusCode": 403,
  "requestId": "01JDNZ8DGVMM...",
  "timestamp": "2025-12-20T09:30:45.123Z",
  "path": "/api/v1/reservations",
  "method": "POST",
  "error": "ForbiddenException",
  "message": "Room capacity exceeded",
  "localizedMessage": {
    "code": "reservation.room_capacity_exceeded",
    "locale": "en",
    "message": "Room capacity exceeded",
    "translations": {
      "en": "Room capacity exceeded",
      "tr": "Oda kapasitesi a§tŽñ"
    },
    "params": {
      "capacity": 2
    }
  },
  "errors": [
    "... validation hatalari varsa burada listelenir ..."
  ]
}
```

Onemli alanlar:
- `message`: her zaman okunabilir (ingilizce) fallback metni.
- `localizedMessage`: varsa `code`, `locale`, `message`, `translations` ve opsiyonel `params` tasir. Bu alan `localizedError()` (`catotel-api/src/common/errors/localized-error.util.ts:17`) cagrilarindan otomatik gelir.
- `errors`: class-validator dogrulama hatalari icin string listesi.

Backend disinda olusan hatalarda (`HttpException` degilse) `localizedMessage` olmayabilir; istemciler bu durumda `message`/`error` alanlarina geri donmelidir.

## I18n katalogu

`@catotel/i18n` paketi (`catotel-clients/i18n/src`) iki locale destekler: `SUPPORTED_LOCALES = ['en', 'tr']`. Error kodlari `ERROR_CODES` enum'u ile export edilir ve `errorCatalog` dosyasi her kod icin ceviri tutar (`catalog.ts:1`).

Paketin sagladigi ana yardimcilar:
- `buildLocalizedMessage(code, params?, { locale? })`: backend tarafinda kullanilir; tum locale'ler icin `translations` alanini doldurur.
- `formatErrorMessage(code, locale, params?)`: istemcide, yalnizca tek bir locale icin metin uretmek isteyen durumlara uygundur.
- `isLocalizedErrorMessage(value)`: gelen JSON'un beklenen tipte olup olmadigini dogrular.

Tum error kodlari `snake-case` namespace yapisindadir (`reservation.room_capacity_exceeded` gibi) ve reusability icin React Native/web tarafindan import edilebilir.

## Web / mobil handling prensipleri

1. **Önce `localizedMessage`a bak**: Gelen `localizedMessage` objesi varsa, kullanicinin tercih ettigi locale'a gore `localizedMessage.translations[locale]` ya da `formatErrorMessage(localizedMessage.code, locale, localizedMessage.params)` ile tekst üretin. Backend `translations` alanini bos locale icin bile doldurdugu icin ekstra API call gerekmez.
2. **Fallback sirasi**:
   - `localizedMessage` yoksa `message` alanini kullan.
   - `message` da yoksa `error` alanini ya da `HTTP ${status}` fallback'ini kullan.
   - Validation hatalari (`errors` arrayi) varsa bunlari da kullaniciya gosterin (örn. form alanlarina baglayin).
3. **Kod bazli branching**: UI'da spesifik error kodlari icin ozellesmis mesajlar gerekiyorsa (örn. `auth.refresh_token_reuse` icin forced logout), `localizedMessage.code` degerini switch-case mantigi ile kullanabilirsiniz.
4. **Logging**: Uygulama loglari/analytics event'lerinde `localizedMessage.code` + `requestId`'i saklamak tesise yardim eder. Mesaj metnini loglamak zorunlu degildir.
5. **Mobil parity**: Expo istemcisi su an `ApiError`'dan sadece plain `message` cikariyor (`catotel-mobile/src/lib/api-client.ts:141`). Bu helper'i, dashboard'taki `handleApiError` logic'ine benzer sekilde guncelleyip `LocalizedErrorMessage` objesini parse ederek UI component'lerine iletmeniz tavsiye edilir (ortak bir `normalizeApiError` helper'ini `@catotel/contracts` altina tasiyacagiz).

## Yeni hata kodu eklerken

1. `catotel-clients/i18n/src/catalog.ts` dosyasinda `ERROR_CODES` dizisine yeni kodu ekle ve `errorCatalog` icinde `en` + `tr` cevirilerini sagla.
2. Backend'de ilgili noktada `localizedError(ERROR_CODES.YENI_KOD, params?)` dondur.
3. Eger UI bu hataya ozel tepki verecekse (örn. modali kapatmak vs.) `localizedMessage.code` uzerinden branch eden logic ekle.
4. Gerekiyorsa testlerde `buildLocalizedMessage` ciktisinin UI'ya dogru aktigini dogrula.

Bu strateji sayesinde backend ile tum istemciler ayni code katalogunu paylasir, ceviriler tek kaynakta tutulur ve error handling akislari tekrar yazilmadan calisir.
