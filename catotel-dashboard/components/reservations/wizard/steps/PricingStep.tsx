import clsx from "clsx";
import { PawPrint } from "lucide-react";

import type { AddonService, RoomType } from "@/types/hotel";

import { Line, StepCard, SummaryStat } from "../components";
import type { PricingBreakdown, ReservationAddonInput } from "../types";
import { formatCurrency, parseAmount } from "../utils";

type SelectedAddonDetail = { service: AddonService; quantity: number };

type PricingStepProps = {
  allowRoomSharing: boolean;
  selectedRoomType: RoomType | null;
  selectedCatCount: number;
  nightCount: number | null;
  checkIn: string;
  checkOut: string;
  addonServices: AddonService[];
  loadingAddonServices: boolean;
  selectedAddons: ReservationAddonInput[];
  onToggleAddon: (serviceId: string) => void;
  onChangeAddonQuantity: (serviceId: string, quantity: number) => void;
  onClearAddons: () => void;
  selectedAddonDetails: SelectedAddonDetail[];
  pricingBreakdown: PricingBreakdown | null;
  pricingSettingsLoading: boolean;
  pricingSettingsError: string | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit?: () => Promise<void> | void;
  submitting?: boolean;
};

export function PricingStep({
  allowRoomSharing,
  selectedRoomType,
  selectedCatCount,
  nightCount,
  checkIn,
  checkOut,
  addonServices,
  loadingAddonServices,
  selectedAddons,
  onToggleAddon,
  onChangeAddonQuantity,
  onClearAddons,
  selectedAddonDetails,
  pricingBreakdown,
  pricingSettingsLoading,
  pricingSettingsError,
  notes,
  onNotesChange,
  onSubmit,
  submitting,
}: PricingStepProps) {
  return (
    <StepCard title="Fiyat & Onay">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Rezervasyon özeti</p>
              <span className="admin-chip">{allowRoomSharing ? "Paylaşımlı kullanım" : "Özel kullanım"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryStat
                label="Oda"
                value={selectedRoomType?.name ?? "Oda seçilmedi"}
                description={
                  selectedRoomType
                    ? `${selectedRoomType.capacity} kedi | Gece: ${formatCurrency(
                        parseAmount(selectedRoomType.nightlyRate),
                      )}`
                    : "Tarih & oda seçim adımını tamamla"
                }
              />
              <SummaryStat
                label="Kedi sayısı"
                value={selectedCatCount > 0 ? `${selectedCatCount} kedi` : "Henüz seçim yok"}
                description={
                  allowRoomSharing && selectedRoomType
                    ? `Kalan slot: ${Math.max(selectedRoomType.capacity - selectedCatCount, 0)}`
                    : undefined
                }
              />
              <SummaryStat
                label="Gece sayısı"
                value={nightCount ? `${nightCount} gece` : "Belirlenmedi"}
                description={
                  checkIn && checkOut ? `${checkIn} -> ${checkOut}` : "Giriş & çıkış tarihleri gerekli"
                }
              />
              <SummaryStat
                label="Fiyatlama modu"
                value={allowRoomSharing ? "Slot bazlı" : "Tam kapasite"}
                description={
                  allowRoomSharing
                    ? "Sadece seçili slotlar ücretlendirilir"
                    : "Odanın tamamı bu rezervasyona ayrılır"
                }
              />
            </div>
            <div className="rounded-2xl bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold text-[var(--admin-muted)] admin-border">
              {allowRoomSharing
                ? "Kalan kapasitelerde diğer müşterilerle paylaşım yapılabilir."
                : "Özel kullanımda oda tamamen bloklanır ve tüm kapasite ücretlendirilir."}
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Ek hizmetler</p>
              {selectedAddons.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--admin-muted)] transition hover:text-peach-500"
                  onClick={onClearAddons}
                >
                  Temizle
                </button>
              )}
            </div>
            {loadingAddonServices ? (
              <p className="text-xs text-[var(--admin-muted)]">Hizmetler yükleniyor...</p>
            ) : addonServices.length ? (
              <div className="space-y-2">
                {addonServices.map((service) => {
                  const selected = selectedAddons.find((item) => item.serviceId === service.id);
                  return (
                    <div
                      key={service.id}
                      className={clsx(
                        "flex flex-col gap-3 rounded-2xl border bg-[var(--admin-surface)] p-3 text-sm font-semibold text-[var(--admin-text-strong)] admin-border sm:flex-row sm:items-center sm:justify-between",
                        selected && "border-peach-300 shadow-sm",
                      )}
                    >
                      <div>
                        <p>{service.name}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {service.description?.trim() || "Açıklama yok"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold">
                          {formatCurrency(parseAmount(service.price))}
                        </span>
                        {selected && (
                          <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-2 py-1 text-xs font-semibold admin-border">
                            <span>Adet</span>
                            <input
                              type="number"
                              min={1}
                              value={selected.quantity}
                              onChange={(event) =>
                                onChangeAddonQuantity(service.id, Number(event.target.value))
                              }
                              className="w-16 bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] focus:outline-none"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleAddon(service.id)}
                          className={clsx(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                            selected
                              ? "border-red-200 text-red-500 hover:-translate-y-0.5 hover:bg-red-50/70"
                              : "text-[var(--admin-text-strong)] hover:-translate-y-0.5 hover:border-peach-200",
                          )}
                        >
                          <PawPrint className="h-4 w-4" aria-hidden />
                          {selected ? "Çıkar" : "Ekle"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--admin-muted)]">
                Henüz tanımlı ek hizmet yok. Ayarlar &gt; Fiyatlandırma bölümünden ekleyebilirsin.
              </p>
            )}
            {selectedAddonDetails.length ? (
              <div className="rounded-2xl border bg-[var(--admin-surface)] p-3 text-xs font-semibold text-[var(--admin-text-strong)] admin-border">
                <p className="mb-2 text-[var(--admin-muted)]">Seçilen hizmetler</p>
                <div className="space-y-1">
                  {selectedAddonDetails.map((entry) => (
                    <div key={entry.service.id} className="flex items-center justify-between">
                      <span>
                        {entry.service.name} × {entry.quantity}
                      </span>
                      <span>{formatCurrency(parseAmount(entry.service.price) * entry.quantity)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 flex items-center justify-between text-sm">
                  <span>Toplam</span>
                  <span>
                    {formatCurrency(
                      selectedAddonDetails.reduce(
                        (sum, item) => sum + parseAmount(item.service.price) * item.quantity,
                        0,
                      ),
                    )}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--admin-muted)]">
                Ek hizmet seçerek rezervasyonu özelleştirebilirsin.
              </p>
            )}
          </div>
          <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">İndirimler</p>
              {pricingSettingsLoading && (
                <span className="text-xs text-[var(--admin-muted)]">Yükleniyor...</span>
              )}
            </div>
            {pricingSettingsError && (
              <p className="text-xs font-semibold text-red-500">
                İndirim ayarları alınamadı. Varsayılan değerler kullanılıyor.
              </p>
            )}
            {pricingBreakdown?.discounts.length ? (
              <div className="space-y-2">
                {pricingBreakdown.discounts.map((discount) => (
                  <div
                    key={`${discount.key}-${discount.percent}`}
                    className="flex items-center justify-between rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 text-sm font-semibold text-emerald-600 admin-border"
                  >
                    <div>
                      <p>{discount.label}</p>
                      <p className="text-xs text-emerald-600">{discount.description}</p>
                    </div>
                    <span>-{formatCurrency(discount.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--admin-muted)]">
                Uygulanabilir indirim bulunamadı. Ayarlar &gt; Fiyatlandırma sekmesinden kural ekleyebilirsin.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Fiyat önizlemesi</p>
            <p className="text-xl font-semibold text-[var(--admin-text-strong)]">
              {pricingBreakdown ? formatCurrency(pricingBreakdown.total) : "-"}
            </p>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            Nihai fiyat rezervasyon kaydedildiğinde backend tarafından hesaplanır.
          </p>
          {pricingBreakdown ? (
            <>
              <Line
                label={`Oda ücreti (${pricingBreakdown.nights} gece x ${pricingBreakdown.slotCount} slot)`}
                value={formatCurrency(pricingBreakdown.baseTotal)}
              />
              {pricingBreakdown.addons.length > 0 && (
                <Line label="Ek hizmetler" value={formatCurrency(pricingBreakdown.addonsTotal)} />
              )}
              {pricingBreakdown.discounts.map((discount) => (
                <Line
                  key={`line-${discount.key}`}
                  label={discount.label}
                  value={`-${formatCurrency(discount.amount)}`}
                  variant="discount"
                />
              ))}
              <Line label="Toplam" value={formatCurrency(pricingBreakdown.total)} variant="total" />
            </>
          ) : (
            <div className="rounded-2xl bg-[var(--admin-surface)] px-3 py-2 text-xs text-[var(--admin-muted)]">
              Fiyat oluşturmak için müşteri, kedi, tarih ve oda seçimini tamamla.
            </div>
          )}
          <textarea
            placeholder="Müşteri notu..."
            className="w-full rounded-2xl border bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            rows={3}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={!onSubmit || submitting}
            onClick={() => onSubmit?.()}
          >
            {submitting ? "Kaydediliyor..." : "Rezervasyonu Oluştur"}
          </button>
        </div>
      </div>
    </StepCard>
  );
}
