export const ROLES = ["user", "mentor", "admin"] as const;
export type Role = (typeof ROLES)[number];
