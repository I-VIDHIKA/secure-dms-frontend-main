import type {
  AnchorStatusRow,
  Confidentiality,
  Document,
  DocumentDetail,
  DocumentType,
  DocumentVersion,
  VerificationResult,
} from "@/types";
import { downloadFile, http, queryString, uploadWithProgress } from "./client";

export interface DocumentFilters {
  case_id?: string;
  doc_type?: DocumentType;
  q?: string;
}

export interface UploadInput {
  case_id: string;
  title: string;
  doc_type: DocumentType;
  confidentiality: Confidentiality;
  file: File;
  on_progress?: (percent: number) => void;
}

export function listDocuments(filters: DocumentFilters = {}): Promise<Document[]> {
  return http(`/documents${queryString(filters)}`);
}

export function getDocument(id: string): Promise<DocumentDetail> {
  return http(`/documents/${encodeURIComponent(id)}`);
}

export function uploadDocument(input: UploadInput): Promise<DocumentDetail> {
  const form = new FormData();
  form.append("case_id", input.case_id);
  form.append("title", input.title);
  form.append("doc_type", input.doc_type);
  form.append("confidentiality", input.confidentiality);
  form.append("file", input.file);
  return uploadWithProgress(`/documents`, form, input.on_progress ?? (() => undefined));
}

export function addVersion(id: string, file: File): Promise<DocumentVersion> {
  const form = new FormData();
  form.append("file", file);
  return http(`/documents/${encodeURIComponent(id)}/versions`, { method: "POST", body: form });
}

export function verifyDocument(id: string, version: number): Promise<VerificationResult> {
  return http(`/documents/${encodeURIComponent(id)}/versions/${version}/verify`, {
    method: "POST",
  });
}

export function retryAnchor(id: string, version: number): Promise<DocumentVersion> {
  return http(`/documents/${encodeURIComponent(id)}/versions/${version}/anchor`, {
    method: "POST",
  });
}

export function downloadVersion(id: string, version: number, filename: string): Promise<void> {
  return downloadFile(
    `/documents/${encodeURIComponent(id)}/versions/${version}/download`,
    filename,
  );
}

/** Lightweight anchoring-progress poll. Not audit-logged on the server. */
export function getAnchorStatus(id: string): Promise<AnchorStatusRow[]> {
  return http(`/documents/${encodeURIComponent(id)}/anchor-status`);
}
