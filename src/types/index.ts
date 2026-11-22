export type Role = "admin" | "investigator" | "viewer";

export const DOCUMENT_TYPES = [
  "FIR",
  "Police Report",
  "Witness Statement",
  "Charge Sheet",
  "Court Filing",
  "Evidence Record",
  "Forensic Report",
  "Legal Notice",
  "Judgment",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const CONFIDENTIALITY_LEVELS = [
  "Public",
  "Restricted",
  "Confidential",
  "Top Secret",
] as const;
export type Confidentiality = (typeof CONFIDENTIALITY_LEVELS)[number];
export type IntegrityStatus = "verified" | "tampered" | "unverified";

export interface PersonSummary {
  id: string;
  name: string;
  designation: string;
  role: Role;
}

export interface User extends PersonSummary {
  email: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  activity_count?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: "open" | "closed";
  created_by: PersonSummary;
  created_at: string;
  updated_at: string;
  assigned: PersonSummary[];
  document_count: number;
}

export interface CaseActivity {
  id: number | string;
  ts: string;
  user: string | PersonSummary;
  action: string;
  target: string;
  details: string;
}

export interface DocumentAnchor {
  status: "pending" | "anchored" | "failed" | "not_configured";
  network: string | null;
  tx_hash: string | null;
  block_number: number | null;
  chain_id: number | null;
  explorer_url: string | null;
  anchored_at: string | null;
  error: string | null;
}

export interface DocumentVersion {
  id: string;
  version: number;
  filename: string;
  mime_type: string;
  size: number;
  sha256: string;
  uploaded_by: string | PersonSummary;
  uploaded_at: string;
  signer: string | PersonSummary | null;
  signature: string | null;
  signature_algorithm: string | null;
  anchor: DocumentAnchor;
}

export interface Document {
  id: string;
  case_id: string;
  case_number: string;
  title: string;
  doc_type: DocumentType;
  confidentiality: Confidentiality;
  created_by: string | PersonSummary;
  created_at: string;
  current_version: number;
  latest_sha256: string;
  anchor_status: DocumentAnchor["status"];
}

export interface DocumentDetail extends Document {
  versions: DocumentVersion[];
}

export interface AnchorStatusRow {
  version: number;
  anchor: DocumentAnchor;
}

export interface VerificationResult {
  overall: "verified" | "tampered";
  integrity: {
    ok: boolean;
    stored_sha256: string;
    computed_sha256?: string | null;
    detail: string;
  };
  signature: { valid: boolean; algorithm: string; signer: string; detail: string };
  blockchain: {
    status: DocumentAnchor["status"];
    network: string | null;
    tx_hash: string | null;
    explorer_url: string | null;
    block_number: number | null;
    checked: boolean;
    on_chain: boolean | null;
    detail: string;
  };
}

export type AuditAction =
  | "LOGIN"
  | "REGISTER"
  | "UPLOAD"
  | "ADD_VERSION"
  | "VIEW"
  | "DOWNLOAD"
  | "VERIFY_INTEGRITY"
  | "VERIFY_SIGNATURE"
  | "CREATE_CASE"
  | "ANCHOR"
  | "ROLE_CHANGE";

export interface AuditEntry {
  id: number | string;
  ts: string;
  user: string;
  action: AuditAction;
  target: string;
  details: string;
  prev_hash: string;
  hash: string;
}

export interface AuditPage {
  total: number;
  items: AuditEntry[];
}

export interface AuditVerification {
  valid: boolean;
  checked: number;
  broken_at?: number | string | null;
  reason?: string | null;
  head?: string;
}

export interface DashboardStats {
  total_documents: number;
  total_versions: number;
  active_cases: number;
  anchored_percent: number;
  tamper_alerts: number;
  documents_by_type: { type: DocumentType; count: number }[];
  uploads_per_day: { date: string; count: number }[];
  recent_activity: CaseActivity[];
}

export interface SearchParams {
  q: string;
  doc_type?: DocumentType;
  case_id?: string;
  confidentiality?: Confidentiality;
  date_from?: string;
  date_to?: string;
}

export interface SearchResult {
  document_id: string;
  title: string;
  doc_type: DocumentType;
  confidentiality: Confidentiality;
  case_id: string;
  case_number: string;
  version: number;
  filename: string;
  snippet: string;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

export interface BlockchainStatus {
  configured: boolean;
  network: string | null;
  contract_address: string | null;
  connected: boolean;
  chain_id?: number | null;
  latest_block?: number | null;
  wallet?: string | null;
  error?: string | null;
}
