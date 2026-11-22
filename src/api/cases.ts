import type { Case, CaseActivity, Document, PersonSummary } from "@/types";
import { http, queryString } from "./client";

export interface CaseFilters {
  search?: string;
  status?: "open" | "closed";
}

export interface NewCaseInput {
  case_number: string;
  title: string;
  description: string;
  assigned_user_ids: string[];
}

export async function listCases(filters: CaseFilters = {}): Promise<Case[]> {
  return http(`/cases${queryString(filters)}`);
}

export function getCase(id: string): Promise<Case> {
  return http(`/cases/${encodeURIComponent(id)}`);
}

export function createCase(input: NewCaseInput): Promise<Case> {
  return http("/cases", { method: "POST", body: JSON.stringify(input) });
}

export function updateCase(id: string, input: { title?: string; description?: string; status?: "open" | "closed" }): Promise<Case> {
  return http(`/cases/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function assignCaseUsers(id: string, user_ids: string[]): Promise<Case> {
  return http(`/cases/${encodeURIComponent(id)}/assignees`, { method: "PUT", body: JSON.stringify({ user_ids }) });
}

export function listCaseDocuments(id: string): Promise<Document[]> {
  return http(`/cases/${encodeURIComponent(id)}/documents`);
}

export function listCaseActivity(id: string): Promise<CaseActivity[]> {
  return http(`/cases/${encodeURIComponent(id)}/activity`);
}

export function listUserDirectory(): Promise<PersonSummary[]> {
  return http("/users/directory");
}