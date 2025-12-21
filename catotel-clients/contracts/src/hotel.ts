import type {
  ReservationStatus,
  CareTaskStatus,
  CareTaskType,
  UserRole,
  PaymentMethod,
  PaymentStatus,
} from './enums';

export type Cat = {
  id: string;
  name: string;
  breed?: string | null;
  gender?: string | null;
  isNeutered?: boolean | null;
  birthDate?: string | null;
  weightKg?: number | string | null;
  dietaryNotes?: string | null;
  medicalNotes?: string | null;
  photoUrl?: string | null;
};

export type RoomType = {
  id: string;
  name: string;
  description?: string | null;
  capacity: number;
  nightlyRate: number | string;
  overbookingLimit?: number;
  capacityOk?: boolean;
  amenities?: Record<string, any> | null;
  isActive: boolean;
  availableUnits?: number;
  totalUnits?: number;
  availableSlots?: number;
  available?: boolean;
};

export type Room = {
  id: string;
  name: string;
  description?: string | null;
  roomType: RoomType;
  roomTypeId?: string;
  isActive: boolean;
};

export type ReservationRoomAssignment = {
  id: string;
  room: {
    id: string;
    name: string;
    roomTypeId: string;
  };
  checkIn: string;
  checkOut: string;
  catCount: number;
  allowRoomSharing?: boolean;
  lockedAt?: string | null;
  cats?: ReservationCat[];
};

export type AddonService = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  isActive: boolean;
};

export type ReservationCat = {
  cat: Cat;
};

export type ReservationService = {
  id: string;
  service: AddonService;
  quantity: number;
  unitPrice: number | string;
};

export type Payment = {
  id: string;
  amount: number | string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string | null;
  processedAt?: string | null;
  createdAt?: string;
};

export type CheckItem = {
  label: string;
  quantity?: number | string | null;
  note?: string | null;
};

export type FeedingPlan = {
  brand?: string | null;
  amountPerMeal?: string | null;
  frequencyPerDay?: number | null;
  instructions?: string | null;
};

export type MedicationPlan = {
  name: string;
  dosage?: string | null;
  schedule?: string | null;
  withFood?: boolean | null;
  notes?: string | null;
};

export type CheckInForm = {
  arrivalTime?: string | null;
  deliveredItems?: CheckItem[];
  foodPlan?: FeedingPlan | null;
  medicationPlan?: MedicationPlan[];
  weightKg?: number | string | null;
  catCondition?: string | null;
  roomId?: string | null;
  hasVaccineCard?: boolean | null;
  hasFleaTreatment?: boolean | null;
  handledBy?: string | null;
  additionalNotes?: string | null;
};

export type CheckOutForm = {
  departureTime?: string | null;
  returnedItems?: CheckItem[];
  catCondition?: string | null;
  incidents?: string | null;
  roomConditionNote?: string | null;
  remainingFood?: string | null;
  nextVisitNote?: string | null;
  handledBy?: string | null;
  additionalNotes?: string | null;
};

export type Reservation = {
  id: string;
  code: string;
  status: ReservationStatus;
  checkIn: string;
  checkOut: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  totalPrice: number | string;
  allowRoomSharing?: boolean;
  reservedSlots?: number;
  checkInForm?: CheckInForm | null;
  checkOutForm?: CheckOutForm | null;
  specialRequests?: string | null;
  customer?: {
    user: { id: string; name?: string | null; email: string };
  } | null;
  roomType: RoomType;
  cats: ReservationCat[];
  services: ReservationService[];
  payments?: Payment[];
  roomAssignments?: ReservationRoomAssignment[];
};

export type CustomerProfile = {
  id: string;
  phone?: string | null;
  preferredVet?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  };
  cats: Cat[];
  reservations: Reservation[];
};

export type CareTask = {
  id: string;
  type: CareTaskType | string;
  status: CareTaskStatus | string;
  notes?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  cat?: Cat | null;
  reservation?:
    | (Reservation & {
        customer?: {
          user: { name?: string | null; email: string };
        };
      })
    | null;
};
