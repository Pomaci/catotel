import type {
  CreateCatDto as GeneratedCreateCatDto,
  UpdateCatDto as GeneratedUpdateCatDto,
  UpdateCustomerDto,
  UpdateTaskStatusDto,
} from '@catotel/api-client';
import type { PaymentMethod, ReservationStatus } from '@/types/enums';
import type { CheckInForm, CheckOutForm } from '@/types/hotel';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonMap = Record<string, JsonValue>;

export type CustomerProfileUpdatePayload = UpdateCustomerDto;

export type CreateCatPayload = GeneratedCreateCatDto & {
  isNeutered?: boolean;
};

export type UpdateCatPayload = GeneratedUpdateCatDto & {
  isNeutered?: boolean;
};

export type CreateAdminCatPayload = CreateCatPayload & {
  customerId: string;
};

export type ReservationAddonPayload = {
  serviceId: string;
  quantity: number;
};

export type ReservationRequestPayload = {
  roomTypeId: string;
  catIds: string[];
  checkIn: string;
  checkOut: string;
  specialRequests?: string;
  customerId?: string;
  allowRoomSharing?: boolean;
  addons?: ReservationAddonPayload[];
};

export type ReservationUpdatePayload = Partial<ReservationRequestPayload> & {
  status?: ReservationStatus;
  checkInForm?: CheckInForm;
  checkOutForm?: CheckOutForm;
};

export type TaskStatusUpdatePayload = UpdateTaskStatusDto;

export type CreatePaymentPayload = {
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
};

export type CreateRoomTypePayload = {
  name: string;
  description?: string;
  capacity: number;
  nightlyRate: number;
  overbookingLimit?: number;
  amenities?: JsonMap | null;
  isActive?: boolean;
};

export type UpdateRoomTypePayload = Partial<CreateRoomTypePayload>;

export type CreateRoomPayload = {
  name: string;
  roomTypeId: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateRoomPayload = Partial<CreateRoomPayload>;

export type CreateCustomerCatPayload = CreateCatPayload;
