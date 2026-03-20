export const ROLES = ["user", "parent", "mentor", "admin"] as const;
export type Role = (typeof ROLES)[number];
