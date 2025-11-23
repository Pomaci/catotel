import type {
  ReservationStatus,
  CareTaskStatus,
  CareTaskType,
  UserRole,
} from '@/types/enums';

export type Cat = {
  id: string;
  name: string;
  breed?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  weightKg?: number | string | null;
  dietaryNotes?: string | null;
  medicalNotes?: string | null;
  photoUrl?: string | null;
};

export type Room = {
  id: string;
  name: string;
  description?: string | null;
  capacity: number;
  nightlyRate: number | string;
  amenities?: Record<string, any> | null;
  isActive: boolean;
};

export type ReservationCat = {
  cat: Cat;
};

export type ReservationService = {
  id: string;
  service: { id: string; name: string; price: number | string };
  quantity: number;
  unitPrice: number | string;
};

export type Reservation = {
  id: string;
  code: string;
  status: ReservationStatus;
  checkIn: string;
  checkOut: string;
  totalPrice: number | string;
  specialRequests?: string | null;
  room: Room;
  cats: ReservationCat[];
  services: ReservationService[];
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
