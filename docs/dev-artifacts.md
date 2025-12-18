# Lokal log ve scratch sureci

Amaç: geliştiricilerin kendi makinesinde oluşturduğu log/test çıktıları ile geçici (*scratch*) dosyaların depo geçmişine sızmasını önlemek.

## Log klasörü süreci
- Tüm servislerin (API, dashboard, mobil, istemci testleri) çalışırken ürettiği çıktıları depo kökündeki `logs/` altında toplayın. Her servis için alt klasör açın (`logs/api`, `logs/dashboard`, `logs/mobile`, `logs/tests` gibi) ve araçlarınızı bu klasörleri hedef gösterecek şekilde yapılandırın.
- `logs/` ve içindeki her şey `.gitignore` tarafından kapsam dışı, dolayısıyla log dosyasını veya test raporunu repo içi başka bir klasörde tutmaya gerek yok.
- Bir çalışmayı paylaşmadan önce `logs/` klasörünü tamamen silebilirsiniz. *nix sistemlerde `rm -rf logs` yeterlidir; PowerShell'de `Remove-Item logs -Recurse -Force` çalışır. Klasör bir sonraki çalıştırmada yeniden oluşur.
- Senaryolara özel log ihtiyacı varsa (ör. Playwright trace, Prisma debug logu), path olarak yine `logs/tests/<senaryo-adı>` türevini kullanın. Böylece test araçlarını topluca temizlemek kolaylaşır.
- 1 MB üstü logların commitlenmediğinden emin olmak için `git status`'ta `logs/` dışı `.log` dosyası görürseniz hemen taşıyın veya silin.

## Scratch dosyaları
- Kod denerken kullanılan hızlı scriptler, JSON payload örnekleri, SQL denemeleri gibi tek seferlik notları depo kökündeki `scratch/` klasöründe tutun. İhtiyaç halinde kullanıcı adı veya tarih bazlı alt klasör kullanın (`scratch/onur/2025-12-17.sql` vb.).
- `.gitignore` içine `scratch/`, `**/scratch/` ve `*.scratch.*` kalıpları eklendi. Böylece `catotel-dashboard/testwrite.txt` gibi dosyaları çalışma klasörünün dışına çıkarmak zorunda kalmadan güvenle saklayabilirsiniz; sadece `mv catotel-dashboard/testwrite.txt scratch/dashboard-testwrite.txt` gibi taşımanız yeterli.
- Scratch klasöründe takip edilmesi gereken kalıcı bir bilgi oluşursa onu `docs/` altına taşıyıp formatlayın; `scratch/` içindeki hiçbir dosya versiyon kontrolüne girmemelidir.
- Ekip içi paylaşıma açmak istemediğiniz notları `scratch/` içinde bırakın, paylaşmak istediklerinizi küçük bir gist veya issue yorumuna dönüştürün. Bu alışkanlık repo geçmişini temiz tutar.
