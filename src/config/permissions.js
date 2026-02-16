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
  USER_VIEW: "users:view",
  USER_UPDATE_ROLE: "users:update:role",

  // Payments
  CREATE_PAYMENT: "create_payment",
  REFUND_PAYMENT: "refund_payment"
};
