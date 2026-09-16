export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  DELIVERY_PARTNER: 'DELIVERY_PARTNER',
  STORE_MANAGER: 'STORE_MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
