export const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  CANCELLED: "CANCELLED",
} as const;

export type ReservationStatus =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const CareTaskStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export type CareTaskStatus =
  (typeof CareTaskStatus)[keyof typeof CareTaskStatus];

export const CareTaskType = {
  FEEDING: "FEEDING",
  CLEANING: "CLEANING",
  MEDICATION: "MEDICATION",
  PLAYTIME: "PLAYTIME",
  CHECKIN: "CHECKIN",
  CHECKOUT: "CHECKOUT",
  NOTE: "NOTE",
} as const;

export type CareTaskType = (typeof CareTaskType)[keyof typeof CareTaskType];

export const USER_ROLES = ["ADMIN", "MANAGER", "STAFF", "CUSTOMER"] as const;
export type UserRole = (typeof USER_ROLES)[number];
