import { PERMISSIONS } from "../permissions/constants";
export const PREDEFINED_ROLES = {
  OWNER: {
    name: "Owner",
    permissions: ["*"],
  },
  ADMIN: {
    name: "Administrator",
    permissions: ["*"],
  },
  MANAGER: {
    name: "Manager",
    permissions: [
      PERMISSIONS.PRODUCT_READ_ALL,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.SALE_READ_ALL,
      PERMISSIONS.CUSTOMER_READ_ALL,
    ],
  },
  STAFF: {
    name: "Staff",
    permissions: [PERMISSIONS.SALE_CREATE, PERMISSIONS.PRODUCT_READ_ALL],
  },
};
