import type { Role, User } from "@/types";
import { http } from "./client";

export function listUsers(): Promise<User[]> {
  return http("/users");
}

export function updateUserRole(id: string, role: Role): Promise<User> {
  return http(`/users/${encodeURIComponent(id)}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
}

export function updateUserActive(id: string, is_active: boolean): Promise<User> {
  return http(`/users/${encodeURIComponent(id)}/active`, { method: "PATCH", body: JSON.stringify({ is_active }) });
}