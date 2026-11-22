import type { AuthResponse, User } from "@/types";
import { http } from "./client";

export function login(email: string, password: string): Promise<AuthResponse> {
  return http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(input: { name: string; email: string; password: string; designation: string }): Promise<AuthResponse> {
  return http("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export function getCurrentUser(): Promise<User> {
  return http("/auth/me");
}

export function logout(): Promise<void> {
  return http("/auth/logout", { method: "POST" });
}