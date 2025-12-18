"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Cat, Reservation, RoomType } from "@/types/hotel";
import type { CustomerSearch } from "@/types/user";

import { Stepper } from "./wizard/components";
import { useReservationWizard } from "./wizard/useReservationWizard";
import { CustomerStep } from "./wizard/steps/CustomerStep";
import { CatsStep } from "./wizard/steps/CatsStep";
import { DatesStep } from "./wizard/steps/DatesStep";
import { PricingStep } from "./wizard/steps/PricingStep";
import type { ReservationWizardValues, StepKey } from "./wizard/types";

type ReservationWizardProps = {
  mode?: "create" | "edit";
  rooms?: RoomType[];
  roomTypes?: RoomType[];
  cats?: Cat[];
  initialReservation?: Reservation | null;
  customerName?: string | null;
  onSubmitAction?: (values: ReservationWizardValues) => Promise<void>;
  submitting?: boolean;
  allowNewCustomer?: boolean;
  customerCreatedCallbackAction?: (nameOrEmail: string) => void;
  initialStep?: StepKey;
};

export function ReservationWizard({
  mode = "create",
  rooms = [],
  roomTypes = [],
  cats = [],
  initialReservation,
  customerName,
  onSubmitAction,
  submitting,
  allowNewCustomer = false,
  customerCreatedCallbackAction,
  initialStep,
}: ReservationWizardProps) {
  const wizard = useReservationWizard({
    mode,
    rooms,
    roomTypes,
    cats,
    initialReservation,
    customerName,
    allowNewCustomer,
    customerCreatedCallbackAction,
    initialStep,
  });

  const {
    isEdit,
    step,
    goNext,
    goPrev,
    wizardError,
    setWizardError,
    nextDisabled,
    validateBeforeSubmit,
    submissionValues,
    hasCustomerSelected,
    selectedCatCount,
    todayIso,
    customer,
    catsState,
    dates,
    pricing,
  } = wizard;

  const handleSubmit = async () => {
    if (!onSubmitAction) {
      return;
    }
    const reason = validateBeforeSubmit();
    if (reason) {
      setWizardError(reason);
      return;
    }
    await onSubmitAction(submissionValues);
  };

  const handleCustomerSelect = (cust: CustomerSearch) => {
    customer.setSelectedCustomer(cust.name ?? cust.email);
    customer.setSelectedCustomerId(cust.id);
  };

  const handleNewCustomerChange = (field: "name" | "email" | "phone", value: string) => {
    customer.setNewCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleCatFormChange = (field: "name" | "breed", value: string) => {
    catsState.setNewCatForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleCat = (catId: string) => {
    catsState.setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const handleAddCat = () => {
    if (!customer.selectedCustomerId) {
      setWizardError("Önce müşteri seçmelisin.");
      return;
    }
    catsState.createCustomerCat.mutate({
      name: catsState.newCatForm.name.trim(),
      breed: catsState.newCatForm.breed.trim() || undefined,
    });
  };

  return (
    <div className="admin-surface space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">
            {mode === "create" ? "Yeni rezervasyon" : "Rezervasyonu düzenle"}
          </p>
          <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">
            4 Adımda {mode === "create" ? "Oluştur" : "Güncelle"}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={!onSubmitAction || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Kaydediliyor..." : mode === "create" ? "Rezervasyonu Oluştur" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>

      <Stepper current={step} />
      {wizardError && <p className="text-sm font-semibold text-red-500">{wizardError}</p>}

      {!isEdit && step === "customer" && (
        <CustomerStep
          allowNewCustomer={allowNewCustomer}
          searchTerm={customer.searchTerm}
          searchResults={customer.searchResults}
          searching={customer.searching}
          selectedCustomerId={customer.selectedCustomerId}
          onSearchChange={customer.handleSearch}
          onSelectCustomer={handleCustomerSelect}
          newCustomer={customer.newCustomer}
          onNewCustomerChange={handleNewCustomerChange}
          onCreateCustomer={customer.handleCreateCustomer}
          creatingCustomer={customer.creatingCustomer}
          customerError={customer.customerError}
          customerSuccess={customer.customerSuccess}
        />
      )}

      {step === "cats" && (
        <CatsStep
          hasCustomerSelected={hasCustomerSelected}
          availableCats={catsState.availableCats}
          selectedCats={catsState.selectedCats}
          onToggleCat={handleToggleCat}
          newCatForm={catsState.newCatForm}
          onNewCatFormChange={handleCatFormChange}
          onAddCat={handleAddCat}
          canAddCat={Boolean(customer.selectedCustomerId && catsState.newCatForm.name.trim())}
          creatingCat={catsState.createCustomerCat.isPending}
          loadingCustomerCats={catsState.loadingCustomerCats}
        />
      )}

      {step === "dates" && (
        <DatesStep
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          todayIso={todayIso}
          nightCount={dates.nightCount}
          onCheckInChange={dates.setCheckIn}
          onCheckOutChange={dates.setCheckOut}
          roomList={dates.roomList}
          loadingAvailability={dates.loadingAvailability}
          selectedRoomTypeId={dates.selectedRoomTypeId}
          onSelectRoomType={dates.setSelectedRoomTypeId}
          allowRoomSharing={dates.allowRoomSharing}
          onToggleRoomSharing={() => dates.setAllowRoomSharing((prev) => !prev)}
          selectedCatCount={selectedCatCount}
          roomAssignments={initialReservation?.roomAssignments}
        />
      )}

      {step === "pricing" && (
        <PricingStep
          allowRoomSharing={dates.allowRoomSharing}
          selectedRoomType={dates.selectedRoomType}
          selectedCatCount={selectedCatCount}
          nightCount={dates.nightCount}
          checkIn={pricing.checkIn}
          checkOut={pricing.checkOut}
          addonServices={pricing.combinedAddonServices}
          loadingAddonServices={pricing.loadingAddonServices}
          selectedAddons={pricing.selectedAddons}
          onToggleAddon={pricing.handleAddonToggle}
          onChangeAddonQuantity={pricing.handleAddonQuantityChange}
          onClearAddons={pricing.clearSelectedAddons}
          selectedAddonDetails={pricing.selectedAddonDetails}
          pricingBreakdown={pricing.pricingBreakdown}
          pricingSettingsLoading={pricing.pricingSettingsLoading}
          pricingSettingsError={pricing.pricingSettingsError}
          notes={pricing.notes}
          onNotesChange={pricing.setNotes}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          disabled={step === "customer" || (isEdit && step === "cats")}
          onClick={goPrev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Geri
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          onClick={goNext}
          disabled={step === "pricing" || nextDisabled}
        >
          İleri
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export type { ReservationWizardValues, StepKey };
