## Catotel Mobile (Expo)

Catotel Dashboard'un karanlik arayuzune ve auth akislarina bire bir uyan Expo mobil istemcisi. Ayni API uclarini kullanir, access/refresh token mantigini guvenli sekilde saklar ve dashboard ekranlarinda `/users/me`, `/auth/sessions`, logout-all gibi islemleri gorsel olarak surdurur.

### Kurulum

```bash
cd catotel-mobile
npm install          # create-expo-app ciktisi hazir; gerekirse tekrar calistir
```

### Ortam Degiskenleri

Expo tarafinda halka acik degiskenler `EXPO_PUBLIC_` prefix'i ile okunur. API adresini `.env` dosyasina ya da calistirma komutuna ekleyebilirsiniz:

```bash
echo EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 > .env
```

Deger verilmezse uygulama `http://localhost:3000/api/v1` adresine baglanir.

### Calistirma

```bash
npm run start        # Metro
npm run android      # Android emulator veya Expo Go
npm run ios          # sadece macOS
npm run web          # web uzerinde hizli test
```

### Mimarik Detaylar

- **Expo Router** ile Next.js app router'a benzer dosya tabanli navigasyon.
- **AuthContext** (`src/context/AuthContext.tsx`) access/refresh token saklama, yenileme, logout ve session senkronizasyonunun tamamindan sorumludur. Token'lar `expo-secure-store` ile cihazda tutulur, web icin fallback vardir.
- **UI Kit** (`src/components/ui`) Next dashboard bilesenlerinin RN karsiligini sunar (Card, Button, Input, Alert, TokenBadge, vb.).
- **Dashboard bilesenleri** (`src/components/dashboard`) artik web panelindeki tum bolumleri kapsar:
  - `DashboardHeader` token aksiyonlarini ve profil/rezervasyon istatistiklerini gosterir.
  - `OverviewCard`, `CatsCard`, `RoomsCard`, `ReservationsCard` ve opsiyonel `TasksCard` backend'den gelen profili, kedi envanterini, oda listesini, rezervasyonlari ve personel gorevlerini dogrudan OpenAPI istemcisi (`src/lib/hotel.ts`) uzerinden ceker.
  - `SessionList` ve `TestFlowsCard` mevcut auth akislarini dogrulamak icin hazir.
  React Query yerine hafif `useDashboardData` hook'u kullanildigi icin Expo Go uzerinde state tutarliligi korunur.

## E2E (Detox)

```bash
npm install -g expo-cli
npm install
detox build --configuration ios.debug
detox test --configuration ios.debug
```

Set `DETOX_TEST_EMAIL` and `DETOX_TEST_PASSWORD` to run the end-to-end login path against a staging backend (otherwise the login test is skipped).
- **Tema** (`src/theme`) koyu renk paleti, spacing ve radius degerlerini merkezilesitirir.

### Test / Dogrulama

- Web backend (`catotel-api`) ve dashboard (`catotel-dashboard`) ile ayni host'ta calistirin ki HttpOnly cookie + Bearer tokenlar eslensin.
- `expo start --tunnel` ile fiziksel cihaza cikarken `EXPO_PUBLIC_API_BASE_URL` ortam degiskenini dis IP/HTTPS'e cekmeyi unutmayin.
- Detox senaryolari oturum acma testini calistirmak icin staging kullanici bilgisi ister; local ortamda `npm run android` ile manuel olarak login + dashboard kartlarini dogrulayabilirsiniz.

### Sonraki Adimlar

- Tasarima ozel ikon ya da font eklemek icin `expo-font` / `@expo-google-fonts` kullanabilirsiniz.
- Session kartlarina swipe-to-delete gibi jestler eklemek icin `react-native-gesture-handler` hazir kurulu.
- Push bildirimleriyle session uyarisi eklemek isterseniz `expo-notifications` modulunu dahil etmeniz yeterli.
