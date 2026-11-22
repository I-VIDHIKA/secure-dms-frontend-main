import { redirect } from "@tanstack/react-router";
import type { Role } from "@/types";
import { getStoredUser } from "@/contexts/auth";

export type Permission = "upload" | "createCase" | "addVersion" | "sign" | "viewAudit" | "manageUsers";

const matrix: Record<Role, Permission[]> = {
  viewer: [],
  investigator: ["upload", "createCase", "addVersion", "sign"],
  admin: ["upload", "createCase", "addVersion", "sign", "viewAudit", "manageUsers"],
};

export const can = (role: Role | undefined, p: Permission) => !!role && matrix[role].includes(p);

/** Route guard: redirects to /login when signed out, /dashboard when the role lacks access. */
export function requireAuth(roles?: Role[]) {
  if (typeof window === "undefined") return;
  const u = getStoredUser();
  if (!u) throw redirect({ to: "/login" });
  if (roles && !roles.includes(u.role)) throw redirect({ to: "/dashboard" });
}
