import type { DashboardStats } from "@/types";
import { http } from "./client";

export function getDashboardStats(): Promise<DashboardStats> {
  return http("/dashboard/stats");
}