import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as casesApi from "@/api/cases";
import * as docsApi from "@/api/documents";
import * as auditApi from "@/api/audit";
import * as usersApi from "@/api/users";
import { getDashboardStats } from "@/api/dashboard";
import { getBlockchainStatus } from "@/api/blockchain";
import { searchDocuments } from "@/api/search";
import { useAuth, useCurrentUser } from "@/contexts/auth";
import type { DocumentDetail, Role, SearchParams } from "@/types";

const errToast = (error: Error) => toast.error(error.message);

export const useDashboard = () => useQuery({ queryKey: ["dashboard"], queryFn: getDashboardStats });
export const useBlockchainStatus = () =>
  useQuery({
    queryKey: ["blockchain-status"],
    queryFn: getBlockchainStatus,
    refetchInterval: 60_000,
  });
export const useCases = (filters: casesApi.CaseFilters = {}) =>
  useQuery({ queryKey: ["cases", filters], queryFn: () => casesApi.listCases(filters) });
export const useCase = (id: string) =>
  useQuery({ queryKey: ["cases", id], queryFn: () => casesApi.getCase(id) });
export const useCaseDocuments = (id: string) =>
  useQuery({ queryKey: ["cases", id, "documents"], queryFn: () => casesApi.listCaseDocuments(id) });
export const useCaseActivity = (id: string) =>
  useQuery({ queryKey: ["cases", id, "activity"], queryFn: () => casesApi.listCaseActivity(id) });
export const useDocuments = (filters: docsApi.DocumentFilters = {}) =>
  useQuery({
    queryKey: ["documents", "list", filters],
    queryFn: () => docsApi.listDocuments(filters),
  });
export const useDocument = (id: string) =>
  useQuery({ queryKey: ["documents", "one", id], queryFn: () => docsApi.getDocument(id) });
export const useAudit = (filters: auditApi.AuditFilters) =>
  useQuery({
    queryKey: ["audit", filters],
    queryFn: () => auditApi.listAudit(filters),
    placeholderData: (previous) => previous,
  });
export const useUsers = () => useQuery({ queryKey: ["users"], queryFn: usersApi.listUsers });
export const useUserDirectory = () =>
  useQuery({ queryKey: ["users", "directory"], queryFn: casesApi.listUserDirectory });
export const useSearch = (params: SearchParams) =>
  useQuery({
    queryKey: ["search", params],
    queryFn: () => searchDocuments(params),
    placeholderData: (previous) => previous,
  });

const POLL_MS = 4000;
const POLL_MAX_AGE_MS = 3 * 60 * 1000;

/**
 * While any version is still "pending" on the blockchain, poll the lightweight
 * anchor-status endpoint (not audit-logged). When nothing is pending any more,
 * refetch the document once so the final tx hash / block number appear.
 */
export function useAnchorPolling(id: string, doc: DocumentDetail | undefined) {
  const queryClient = useQueryClient();
  const pending = !!doc?.versions.some(
    (v) =>
      v.anchor.status === "pending" &&
      Date.now() - new Date(v.uploaded_at).getTime() < POLL_MAX_AGE_MS,
  );
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(async () => {
      try {
        const rows = await docsApi.getAnchorStatus(id);
        if (!rows.some((row) => row.anchor.status === "pending")) {
          window.clearInterval(timer);
          void queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
      } catch {
        // transient network error: keep polling
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [pending, id, queryClient]);
  return pending;
}

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useCreateCase() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: casesApi.createCase,
    onSuccess: (created) => {
      toast.success(`Case ${created.case_number} created`);
      void invalidate();
    },
    onError: errToast,
  });
}

export function useUpdateCase(id: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: { title?: string; description?: string; status?: "open" | "closed" }) =>
      casesApi.updateCase(id, input),
    onSuccess: (updated) => {
      toast.success(`Case ${updated.case_number} is now ${updated.status}`);
      void invalidate();
    },
    onError: errToast,
  });
}

export function useUploadDocument() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: docsApi.uploadDocument,
    onSuccess: (document) => {
      toast.success(`${document.title} uploaded`);
      void invalidate();
    },
    onError: errToast,
  });
}

export function useAddVersion(id: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (file: File) => docsApi.addVersion(id, file),
    onSuccess: (version) => {
      toast.success(`Version ${version.version} added`);
      void invalidate();
    },
    onError: errToast,
  });
}

/** Verification only reads data, so nothing needs to be refetched afterwards. */
export function useVerifyDocument(id: string, version: number) {
  return useMutation({
    mutationFn: () => docsApi.verifyDocument(id, version),
    onSuccess: (result) => {
      if (result.overall === "verified") toast.success("Document verification passed");
      else toast.error("Document verification detected tampering");
    },
    onError: errToast,
  });
}

export function useRetryAnchor(id: string, version: number) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: () => docsApi.retryAnchor(id, version),
    onSuccess: () => {
      toast.success("Anchoring retry requested");
      void invalidate();
    },
    onError: errToast,
  });
}

export function useDownloadVersion(id: string, version: number, filename: string) {
  return useMutation({
    mutationFn: () => docsApi.downloadVersion(id, version, filename),
    onSuccess: () => toast.success("Download started"),
    onError: errToast,
  });
}

export function useVerifyChain() {
  return useMutation({
    mutationFn: auditApi.verifyChain,
    onSuccess: (result) => {
      if (!result.valid)
        toast.error(
          result.reason || `Audit chain broken at entry ${result.broken_at ?? "unknown"}`,
        );
    },
    onError: errToast,
  });
}

export function useExportAudit() {
  return useMutation({
    mutationFn: auditApi.exportAudit,
    onSuccess: () => toast.success("Audit log exported"),
    onError: errToast,
  });
}

export function useUpdateRole() {
  const actor = useCurrentUser();
  const { updateSelf } = useAuth();
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => usersApi.updateUserRole(id, role),
    onSuccess: (updated) => {
      toast.success(`${updated.name} is now ${updated.role}`);
      if (updated.id === actor.id) updateSelf(updated);
      void invalidate();
    },
    onError: errToast,
  });
}

export function useUpdateActive() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersApi.updateUserActive(id, is_active),
    onSuccess: (updated) => {
      toast.success(`${updated.name} ${updated.is_active ? "activated" : "deactivated"}`);
      void invalidate();
    },
    onError: errToast,
  });
}
