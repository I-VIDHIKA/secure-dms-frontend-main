import type { AuditPage, AuditVerification } from "@/types";
import { downloadFile, http, queryString } from "./client";

export interface AuditFilters {
  user?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  limit: number;
  offset: number;
}

export function listAudit(filters: AuditFilters): Promise<AuditPage> {
  return http(`/audit${queryString(filters)}`);
}

export function verifyChain(): Promise<AuditVerification> {
  return http("/audit/verify");
}

export function exportAudit(): Promise<void> {
  return downloadFile("/audit/export", "audit_log.csv");
}