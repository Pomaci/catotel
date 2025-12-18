export const SUPPORTED_LOCALES = ['en', 'tr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export interface ErrorDescriptor {
  translations: Record<Locale, string>;
  defaultLocale?: Locale;
}

export const ERROR_CODES = {
  AUTH_MISSING_CREDENTIALS: 'auth.missing_credentials',
  AUTH_USER_NOT_IN_REQUEST: 'auth.user_not_in_request',
  AUTH_INVALID_CREDENTIALS: 'auth.invalid_credentials',
  AUTH_REFRESH_TOKEN_MISSING_JTI: 'auth.refresh_token_missing_jti',
  AUTH_REFRESH_TOKEN_REUSE: 'auth.refresh_token_reuse',
  AUTH_INVALID_REFRESH_TOKEN: 'auth.invalid_refresh_token',
  AUTH_SESSION_NOT_FOUND: 'auth.session_not_found',
  AUTH_CANNOT_REVOKE_SESSION: 'auth.cannot_revoke_session',
  AUTH_INVALID_TOKEN_PAYLOAD: 'auth.invalid_token_payload',
  AUTH_USER_ID_MISSING: 'auth.user_id_missing',
  AUTH_PAYLOAD_MISSING: 'auth.payload_missing',
  AUTH_INSUFFICIENT_PERMISSIONS: 'auth.insufficient_permissions',
  USER_NOT_FOUND: 'user.not_found',
  USER_EMAIL_CONFLICT: 'user.email_conflict',
  USER_INVALID_PHONE: 'user.invalid_phone',
  PASSWORD_RESET_TOKEN_INVALID: 'password_reset.token_invalid',
  PASSWORD_RESET_RATE_LIMITED: 'password_reset.rate_limited',
  CUSTOMER_PROFILE_NOT_FOUND: 'customer.profile_not_found',
  CUSTOMER_NOT_FOUND: 'customer.not_found',
  CAT_NOT_FOUND: 'cat.not_found',
  CAT_FORBIDDEN_OWNER: 'cat.forbidden_owner',
  RESERVATION_CAT_NOT_OWNED: 'reservation.cat_not_owned',
  RESERVATION_NOT_FOUND: 'reservation.not_found',
  RESERVATION_FORBIDDEN_VIEW: 'reservation.forbidden_view',
  RESERVATION_ROOM_TYPE_REQUIRED: 'reservation.room_type_required',
  RESERVATION_INVALID_DATE_RANGE: 'reservation.invalid_date_range',
  RESERVATION_CHECKIN_IN_PAST: 'reservation.checkin_in_past',
  RESERVATION_CATS_NOT_FOUND: 'reservation.cats_not_found',
  RESERVATION_ROOM_TYPE_NOT_AVAILABLE: 'reservation.room_type_not_available',
  RESERVATION_ROOM_TYPE_UNAVAILABLE_DATES: 'reservation.room_type_unavailable_dates',
  RESERVATION_ROOM_CAPACITY_EXCEEDED: 'reservation.room_capacity_exceeded',
  RESERVATION_NO_ACTIVE_ROOMS: 'reservation.no_active_rooms',
  RESERVATION_CUSTOMER_ID_REQUIRED: 'reservation.customer_id_required',
  RESERVATION_UPDATE_FORBIDDEN: 'reservation.update_forbidden',
  RESERVATION_MIN_CATS_REQUIRED: 'reservation.min_cats_required',
  RESERVATION_CAT_CONFLICT: 'reservation.cat_conflict',
  RESERVATION_ROOM_ASSIGNMENT_NO_ROOM: 'reservation.room_assignment_no_room',
  RESERVATION_ROOM_ASSIGNMENT_CAPACITY: 'reservation.room_assignment_capacity',
  ROOM_TYPE_NOT_FOUND: 'room_type.not_found',
  ROOM_TYPE_NOT_ACTIVE: 'room_type.not_active',
  ROOM_TYPE_NOT_AVAILABLE: 'room_type.not_available',
  ROOM_TYPE_NO_ACTIVE_ROOMS: 'room_type.no_active_rooms',
  ROOM_TYPE_AVAILABILITY_RANGE_REQUIRED: 'room_type.availability_range_required',
  ROOM_TYPE_PARTY_SIZE_INVALID: 'room_type.party_size_invalid',
  ROOM_NOT_FOUND: 'room.not_found',
  ADDON_SERVICE_NOT_FOUND: 'addon_service.not_found',
  STAFF_TASK_NOT_FOUND: 'staff.task_not_found',
  STAFF_TASK_FORBIDDEN: 'staff.task_forbidden',
  VALIDATION_FIELD_REQUIRED: 'validation.field_required',
  VALIDATION_INVALID_DATE: 'validation.invalid_date',
  MAIL_SMTP_INCOMPLETE: 'mail.smtp_incomplete',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const errorCatalog = {
  [ERROR_CODES.AUTH_MISSING_CREDENTIALS]: {
    translations: {
      en: 'Missing credentials',
      tr: 'Kimlik bilgileri eksik',
    },
  },
  [ERROR_CODES.AUTH_USER_NOT_IN_REQUEST]: {
    translations: {
      en: 'User not found in request',
      tr: 'İstek içinde kullanıcı bulunamadı',
    },
  },
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
    translations: {
      en: 'Invalid credentials',
      tr: 'Geçersiz kimlik bilgileri',
    },
  },
  [ERROR_CODES.AUTH_REFRESH_TOKEN_MISSING_JTI]: {
    translations: {
      en: 'Refresh token is missing jti',
      tr: 'Yenileme jetonunda jti değeri yok',
    },
  },
  [ERROR_CODES.AUTH_REFRESH_TOKEN_REUSE]: {
    translations: {
      en: 'Refresh token reuse detected',
      tr: 'Yenileme jetonunun tekrar kullanımı tespit edildi',
    },
  },
  [ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN]: {
    translations: {
      en: 'Invalid refresh token',
      tr: 'Geçersiz yenileme jetonu',
    },
  },
  [ERROR_CODES.AUTH_SESSION_NOT_FOUND]: {
    translations: {
      en: 'Session not found or already logged out',
      tr: 'Oturum bulunamadı ya da zaten kapatıldı',
    },
  },
  [ERROR_CODES.AUTH_CANNOT_REVOKE_SESSION]: {
    translations: {
      en: 'Cannot revoke this session',
      tr: 'Bu oturum iptal edilemez',
    },
  },
  [ERROR_CODES.AUTH_INVALID_TOKEN_PAYLOAD]: {
    translations: {
      en: 'Invalid token payload',
      tr: 'Jeton yükü geçersiz',
    },
  },
  [ERROR_CODES.AUTH_USER_ID_MISSING]: {
    translations: {
      en: 'User ID not found in token',
      tr: 'Jetonda kullanıcı kimliği bulunamadı',
    },
  },
  [ERROR_CODES.AUTH_PAYLOAD_MISSING]: {
    translations: {
      en: 'User payload missing',
      tr: 'Kullanıcı bilgisi eksik',
    },
  },
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: {
    translations: {
      en: 'Insufficient permissions',
      tr: 'Yetersiz yetki',
    },
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    translations: {
      en: 'User not found',
      tr: 'Kullanıcı bulunamadı',
    },
  },
  [ERROR_CODES.USER_EMAIL_CONFLICT]: {
    translations: {
      en: 'Email already registered',
      tr: 'E-posta zaten kayıtlı',
    },
  },
  [ERROR_CODES.USER_INVALID_PHONE]: {
    translations: {
      en: 'Invalid phone number',
      tr: 'Geçersiz telefon numarası',
    },
  },
  [ERROR_CODES.PASSWORD_RESET_TOKEN_INVALID]: {
    translations: {
      en: 'Invalid or expired token',
      tr: 'Geçersiz veya süresi dolmuş jeton',
    },
  },
  [ERROR_CODES.PASSWORD_RESET_RATE_LIMITED]: {
    translations: {
      en: 'Too many password reset requests. Please try again later.',
      tr: 'Çok fazla şifre sıfırlama isteği gönderildi. Lütfen daha sonra tekrar deneyin.',
    },
  },
  [ERROR_CODES.CUSTOMER_PROFILE_NOT_FOUND]: {
    translations: {
      en: 'Customer profile not found',
      tr: 'Müşteri profili bulunamadı',
    },
  },
  [ERROR_CODES.CUSTOMER_NOT_FOUND]: {
    translations: {
      en: 'Customer not found',
      tr: 'Müşteri bulunamadı',
    },
  },
  [ERROR_CODES.CAT_NOT_FOUND]: {
    translations: {
      en: 'Cat not found',
      tr: 'Kedi bulunamadı',
    },
  },
  [ERROR_CODES.CAT_FORBIDDEN_OWNER]: {
    translations: {
      en: 'This cat does not belong to you',
      tr: 'Bu kedi size ait değil',
    },
  },
  [ERROR_CODES.RESERVATION_CAT_NOT_OWNED]: {
    translations: {
      en: 'Cat {{catName}} does not belong to the selected customer',
      tr: '{{catName}} adlı kedi seçilen müşteriye ait değil',
    },
  },
  [ERROR_CODES.RESERVATION_NOT_FOUND]: {
    translations: {
      en: 'Reservation not found',
      tr: 'Rezervasyon bulunamadı',
    },
  },
  [ERROR_CODES.RESERVATION_FORBIDDEN_VIEW]: {
    translations: {
      en: 'You cannot view this reservation',
      tr: 'Bu rezervasyonu görüntüleme yetkiniz yok',
    },
  },
  [ERROR_CODES.RESERVATION_ROOM_TYPE_REQUIRED]: {
    translations: {
      en: 'roomTypeId is required',
      tr: 'roomTypeId alanı gerekli',
    },
  },
  [ERROR_CODES.RESERVATION_INVALID_DATE_RANGE]: {
    translations: {
      en: 'Check-out must be after check-in',
      tr: 'Çıkış tarihi giriş tarihinden sonra olmalı',
    },
  },
  [ERROR_CODES.RESERVATION_CHECKIN_IN_PAST]: {
    translations: {
      en: 'Check-in cannot be in the past',
      tr: 'Giriş tarihi geçmişte olamaz',
    },
  },
  [ERROR_CODES.RESERVATION_CATS_NOT_FOUND]: {
    translations: {
      en: 'Some cats were not found',
      tr: 'Bazı kediler bulunamadı',
    },
  },
  [ERROR_CODES.RESERVATION_ROOM_TYPE_NOT_AVAILABLE]: {
    translations: {
      en: 'Room type not available',
      tr: 'Oda tipi uygun değil',
    },
  },
  [ERROR_CODES.RESERVATION_ROOM_TYPE_UNAVAILABLE_DATES]: {
    translations: {
      en: 'Room type not available for selected dates',
      tr: 'Seçilen tarihler için oda tipi uygun değil',
    },
  },
  [ERROR_CODES.RESERVATION_ROOM_CAPACITY_EXCEEDED]: {
    translations: {
      en: 'Room capacity exceeded',
      tr: 'Oda kapasitesi aşıldı',
    },
  },
  [ERROR_CODES.RESERVATION_NO_ACTIVE_ROOMS]: {
    translations: {
      en: 'No active rooms exist for the selected room type',
      tr: 'Seçilen oda tipi için aktif oda yok',
    },
  },
  [ERROR_CODES.RESERVATION_CUSTOMER_ID_REQUIRED]: {
    translations: {
      en: 'customerId is required for staff or admin users',
      tr: 'Personel veya admin için customerId gereklidir',
    },
  },
  [ERROR_CODES.RESERVATION_UPDATE_FORBIDDEN]: {
    translations: {
      en: 'Only staff can update reservations',
      tr: 'Rezervasyonları yalnızca personel güncelleyebilir',
    },
  },
  [ERROR_CODES.RESERVATION_MIN_CATS_REQUIRED]: {
    translations: {
      en: 'At least one cat is required',
      tr: 'En az bir kedi seçilmelidir',
    },
  },
  [ERROR_CODES.RESERVATION_CAT_CONFLICT]: {
    translations: {
      en: 'Conflicting reservation exists for selected cats: {{catNames}}',
      tr: 'Seçilen kediler için çakışan rezervasyon var: {{catNames}}',
    },
  },
  [ERROR_CODES.RESERVATION_ROOM_ASSIGNMENT_NO_ROOM]: {
    translations: {
      en: 'No suitable room available. Please adjust dates or room type.',
      tr: 'Uygun oda bulunamadı. Lütfen tarihleri veya oda tipini güncelleyin.',
    },
  },
  [ERROR_CODES.RESERVATION_ROOM_ASSIGNMENT_CAPACITY]: {
    translations: {
      en: 'Reservation exceeds the capacity of the selected room type.',
      tr: 'Rezervasyon seçilen oda tipinin kapasitesini aşıyor.',
    },
  },
  [ERROR_CODES.ROOM_TYPE_NOT_FOUND]: {
    translations: {
      en: 'Room type not found',
      tr: 'Oda tipi bulunamadı',
    },
  },
  [ERROR_CODES.ROOM_TYPE_NOT_ACTIVE]: {
    translations: {
      en: 'Room type not found or inactive',
      tr: 'Oda tipi bulunamadı ya da pasif',
    },
  },
  [ERROR_CODES.ROOM_TYPE_NOT_AVAILABLE]: {
    translations: {
      en: 'Room type not available',
      tr: 'Oda tipi uygun değil',
    },
  },
  [ERROR_CODES.ROOM_TYPE_NO_ACTIVE_ROOMS]: {
    translations: {
      en: 'No active rooms exist for the selected room type',
      tr: 'Seçilen oda tipi için aktif oda yok',
    },
  },
  [ERROR_CODES.ROOM_TYPE_AVAILABILITY_RANGE_REQUIRED]: {
    translations: {
      en: 'Both checkIn and checkOut are required',
      tr: 'checkIn ve checkOut alanlarının ikisi de gerekli',
    },
  },
  [ERROR_CODES.ROOM_TYPE_PARTY_SIZE_INVALID]: {
    translations: {
      en: 'partySize must be a number',
      tr: 'partySize sayısal olmalıdır',
    },
  },
  [ERROR_CODES.ROOM_NOT_FOUND]: {
    translations: {
      en: 'Room not found',
      tr: 'Oda bulunamadı',
    },
  },
  [ERROR_CODES.ADDON_SERVICE_NOT_FOUND]: {
    translations: {
      en: 'Addon service not found',
      tr: 'Ek hizmet bulunamadı',
    },
  },
  [ERROR_CODES.STAFF_TASK_NOT_FOUND]: {
    translations: {
      en: 'Task not found',
      tr: 'Görev bulunamadı',
    },
  },
  [ERROR_CODES.STAFF_TASK_FORBIDDEN]: {
    translations: {
      en: 'This task is assigned to another staff member',
      tr: 'Bu görev başka bir personele atanmış',
    },
  },
  [ERROR_CODES.VALIDATION_FIELD_REQUIRED]: {
    translations: {
      en: '{{field}} is required',
      tr: '{{field}} alanı gerekli',
    },
  },
  [ERROR_CODES.VALIDATION_INVALID_DATE]: {
    translations: {
      en: '{{field}} must be a valid ISO-8601 date string',
      tr: '{{field}} geçerli bir ISO-8601 tarih olmalıdır',
    },
  },
  [ERROR_CODES.MAIL_SMTP_INCOMPLETE]: {
    translations: {
      en: 'SMTP configuration is incomplete.',
      tr: 'SMTP yapılandırması eksik.',
    },
  },
} as const satisfies Record<ErrorCode, ErrorDescriptor>;
