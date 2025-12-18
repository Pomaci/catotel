import clsx from "clsx";
import { Check, PawPrint, Search } from "lucide-react";

import type { Cat } from "@/types/hotel";

import { Field, StepCard } from "../components";

type CatsStepProps = {
  hasCustomerSelected: boolean;
  availableCats: Cat[];
  selectedCats: string[];
  onToggleCat: (catId: string) => void;
  newCatForm: { name: string; breed: string };
  onNewCatFormChange: (field: "name" | "breed", value: string) => void;
  onAddCat: () => void;
  canAddCat: boolean;
  creatingCat: boolean;
  loadingCustomerCats: boolean;
};

export function CatsStep({
  hasCustomerSelected,
  availableCats,
  selectedCats,
  onToggleCat,
  newCatForm,
  onNewCatFormChange,
  onAddCat,
  canAddCat,
  creatingCat,
  loadingCustomerCats,
}: CatsStepProps) {
  if (!hasCustomerSelected) {
    return (
      <StepCard title="Kedi seçimi">
        <p className="text-sm text-[var(--admin-muted)]">İlerlemek için önce müşteri seç.</p>
      </StepCard>
    );
  }

  return (
    <StepCard title="Kedi seçimi">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Müşterinin kedileri</p>
            {loadingCustomerCats && (
              <span className="text-xs text-[var(--admin-muted)]">Yükleniyor...</span>
            )}
          </div>
          <div className="min-h-[12rem] max-h-[26rem] overflow-y-auto pr-1">
            {availableCats.length === 0 ? (
              <p className="text-xs text-[var(--admin-muted)]">Henüz kedi eklenmemiş.</p>
            ) : (
              <div className="grid gap-3">
                {availableCats.map((cat) => {
                  const checked = selectedCats.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onToggleCat(cat.id)}
                      className={clsx(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition admin-border",
                        checked
                          ? "border-peach-300 bg-[var(--admin-highlight-muted)]"
                          : "hover:border-peach-200",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                          <PawPrint className="h-4 w-4" aria-hidden />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{cat.name}</p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {cat.breed ?? "Cins bilinmiyor"}
                          </p>
                        </div>
                      </div>
                      {checked && <Check className="h-4 w-4 text-peach-500" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
          <p className="text-sm font-semibold">Yeni kedi ekle</p>
          <Field
            icon={<PawPrint className="h-4 w-4" aria-hidden />}
            placeholder="Kedi adı"
            value={newCatForm.name}
            onChange={(v) => onNewCatFormChange("name", v)}
          />
          <Field
            icon={<Search className="h-4 w-4" aria-hidden />}
            placeholder="Cins (opsiyonel)"
            value={newCatForm.breed}
            onChange={(v) => onNewCatFormChange("breed", v)}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={!canAddCat || creatingCat}
            onClick={onAddCat}
          >
            {creatingCat ? "Kaydediliyor..." : "Kedi Ekle"}
          </button>
        </div>
      </div>
    </StepCard>
  );
}
