export const PERMISSIONS = {
  // Orders
  ORDER_CREATE: "orders:create",
  ORDER_VIEW_OWN: "orders:view:own",
  ORDER_VIEW_ALL: "orders:view:all",
  ORDER_UPDATE_STATUS: "orders:update:status",
  ORDER_CANCEL: "orders:cancel",
  ORDER_DELETE: "orders:delete",

  

  // Products
  PRODUCT_CREATE: "products:create",
  PRODUCT_UPDATE: "products:update",
  PRODUCT_DELETE: "products:delete",
  PRODUCT_VIEW: "products:view",

  // Users
  USER_UPDATE_ROLE: "users:update:role",

  // Payments
  CREATE_PAYMENT: "create_payment",
  REFUND_PAYMENT: "refund_payment",

  // User permissions
  USER_MANAGE: 'user:manage', // ✅ أضف هذا
  USER_VIEW: 'user:view',
  USER_DELETE: 'user:delete'
};
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};

  export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  [ROLES.MANAGER]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.USER_VIEW // Managers can view users but not manage them
  ],

  [ROLES.USER]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_VIEW_OWN,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.CREATE_PAYMENT
  ]
};
