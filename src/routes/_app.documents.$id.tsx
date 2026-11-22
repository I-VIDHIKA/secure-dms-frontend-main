import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Blocks,
  Download,
  ExternalLink,
  FilePlus2,
  Fingerprint,
  Loader2,
  PenLine,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, LoadingSkeleton } from "@/components/common";
import {
  AnchorBadge,
  ConfidentialityBadge,
  HashText,
  SignatureBadge,
  VerifyBadge,
} from "@/components/security";
import { VersionList } from "@/components/documents/VersionList";
import { UploadDropzone } from "@/components/documents/UploadDropzone";
import {
  useAddVersion,
  useAnchorPolling,
  useDocument,
  useDownloadVersion,
  useRetryAnchor,
  useVerifyDocument,
} from "@/hooks/use-api";
import { useCurrentUser } from "@/contexts/auth";
import { can } from "@/lib/permissions";
import { formatBytes, formatDateTime, personName } from "@/lib/format";
import { toast } from "sonner";
import type { DocumentDetail, DocumentVersion } from "@/types";

export const Route = createFileRoute("/_app/documents/$id")({
  head: () => ({
    meta: [
      { title: "Document — Secure DMS" },
      {
        name: "description",
        content: "Document metadata, version history, integrity, signature and blockchain anchor.",
      },
      { property: "og:title", content: "Document — Secure DMS" },
      { property: "og:description", content: "Verify document integrity and provenance." },
    ],
  }),
  component: DocumentPage,
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function DocumentPage() {
  const { id } = Route.useParams();
  const user = useCurrentUser();
  const { data: doc, isLoading, error } = useDocument(id);
  const [selected, setSelected] = useState<number | null>(null);
  useAnchorPolling(id, doc);

  if (error) {
    return (
      <EmptyState
        title="Document not found"
        description={error.message}
        action={
          <Button asChild variant="outline">
            <Link to="/search">Search documents</Link>
          </Button>
        }
      />
    );
  }
  if (isLoading || !doc) return <LoadingSkeleton />;

  // The API lists versions newest first.
  const version =
    doc.versions.find((v) => v.version === (selected ?? doc.current_version)) ?? doc.versions[0];

  return (
    <>
      <Link
        to="/cases/$id"
        params={{ id: doc.case_id }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {doc.case_number}
      </Link>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hash text-sm text-muted-foreground">{doc.case_number}</span>
            <ConfidentialityBadge level={doc.confidentiality} />
            <AnchorBadge status={version.anchor.status} />
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{doc.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing version v{version.version}
            {version.version === doc.current_version ? " (current)" : ""}. Click a row in the
            version history to switch.
          </p>
        </div>
        <div className="flex gap-2">
          <DownloadButton docId={doc.id} version={version} />
          {can(user.role, "addVersion") && <NewVersionDialog docId={doc.id} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Metadata</h2>
            <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
              <Row label="Type">{doc.doc_type}</Row>
              <Row label="Case">{doc.case_number}</Row>
              <Row label="Current version">v{doc.current_version}</Row>
              <Row label="Created">{formatDateTime(doc.created_at)}</Row>
              <Row label="Created by">{personName(doc.created_by)}</Row>
              <Row label="Uploaded by">{personName(version.uploaded_by)}</Row>
              <Row label="File">
                <span className="hash">{version.filename}</span>
              </Row>
              <Row label="Size">
                {formatBytes(version.size)} · {version.mime_type}
              </Row>
            </div>
          </Card>
          <div>
            <h2 className="mb-3 text-sm font-semibold">Version history</h2>
            <VersionList
              versions={doc.versions}
              currentVersion={doc.current_version}
              selected={version.version}
              onSelect={setSelected}
            />
          </div>
        </div>

        {/* keyed so verification results never leak from one version to another */}
        <SecurityPanel key={version.id} doc={doc} version={version} />
      </div>
    </>
  );
}

function DownloadButton({ docId, version }: { docId: string; version: DocumentVersion }) {
  const download = useDownloadVersion(docId, version.version, version.filename);
  return (
    <Button variant="outline" onClick={() => download.mutate()} disabled={download.isPending}>
      {download.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download
    </Button>
  );
}

function SecurityPanel({ doc, version }: { doc: DocumentDetail; version: DocumentVersion }) {
  const user = useCurrentUser();
  const verify = useVerifyDocument(doc.id, version.version);
  const retry = useRetryAnchor(doc.id, version.version);
  const result = verify.data;
  const anchor = version.anchor;

  const integrityStatus = verify.isPending
    ? "checking"
    : result
      ? result.integrity.ok
        ? "verified"
        : "tampered"
      : "unverified";

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Verify this version</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Decrypts the stored file, re-computes its SHA-256, checks the signature and looks the hash
          up on the blockchain.
        </p>
        <Button className="mt-3 w-full" onClick={() => verify.mutate()} disabled={verify.isPending}>
          {verify.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Verify v{version.version}
        </Button>
        {result && (
          <div
            className={`mt-3 rounded-md border p-3 text-sm ${result.overall === "verified" ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"}`}
          >
            <p
              className={`font-semibold ${result.overall === "verified" ? "text-success" : "text-destructive"}`}
            >
              {result.overall === "verified"
                ? "VERIFIED: all checks passed"
                : "TAMPERED: at least one check failed"}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Integrity</h3>
        </div>
        <div className="mt-3 divide-y">
          <Row label="Status">
            <VerifyBadge status={integrityStatus} />
          </Row>
          <Row label="Stored SHA-256">
            <HashText value={version.sha256} />
          </Row>
        </div>
        {result && (
          <p
            className={`mt-2 text-xs ${result.integrity.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {result.integrity.detail}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Digital signature</h3>
        </div>
        <div className="mt-3 divide-y">
          <Row label="Signer">{personName(version.signer)}</Row>
          <Row label="Algorithm">
            <span className="hash">{version.signature_algorithm ?? "—"}</span>
          </Row>
          {version.signature && (
            <Row label="Signature">
              <HashText value={version.signature} />
            </Row>
          )}
          <Row label="Signed">{formatDateTime(version.uploaded_at)}</Row>
          <Row label="Status">
            <SignatureBadge valid={result ? result.signature.valid : null} />
          </Row>
        </div>
        {result && !result.signature.valid && (
          <p className="mt-2 text-xs text-destructive">{result.signature.detail}</p>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Blocks className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Blockchain anchor</h3>
        </div>
        <div className="mt-3 divide-y">
          <Row label="Status">
            <AnchorBadge status={anchor.status} />
          </Row>
          {anchor.network && <Row label="Network">{anchor.network}</Row>}
          {anchor.tx_hash && (
            <Row label="Transaction">
              <HashText value={anchor.tx_hash} head={10} />
            </Row>
          )}
          {anchor.block_number != null && (
            <Row label="Block">
              <span className="tabular-nums">#{anchor.block_number}</span>
            </Row>
          )}
          {anchor.anchored_at && <Row label="Anchored">{formatDateTime(anchor.anchored_at)}</Row>}
          {result?.blockchain.checked && (
            <Row label="On-chain check">
              {result.blockchain.on_chain ? (
                <Badge variant="success">Hash found on-chain</Badge>
              ) : (
                <Badge variant="danger">Hash NOT on-chain</Badge>
              )}
            </Row>
          )}
        </div>
        {anchor.explorer_url && (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <a href={anchor.explorer_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              View on explorer
            </a>
          </Button>
        )}
        {anchor.status === "pending" && (
          <p className="mt-2 text-xs text-muted-foreground">
            The hash is being written to the blockchain. This page updates by itself.
          </p>
        )}
        {anchor.status === "not_configured" && (
          <p className="mt-2 text-xs text-muted-foreground">
            The server has no blockchain configured, so this version is not anchored.
          </p>
        )}
        {anchor.status === "failed" && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-destructive">{anchor.error ?? "Anchoring failed."}</p>
            {can(user.role, "upload") && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => retry.mutate()}
                disabled={retry.isPending}
              >
                {retry.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Retry anchoring
              </Button>
            )}
          </div>
        )}
        {result && !result.blockchain.checked && result.blockchain.detail && (
          <p className="mt-2 text-xs text-muted-foreground">{result.blockchain.detail}</p>
        )}
      </Card>
    </div>
  );
}

function NewVersionDialog({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const add = useAddVersion(docId);
  const submit = () => {
    if (!file) return toast.error("Attach a file");
    add.mutate(file, {
      onSuccess: () => {
        setOpen(false);
        setFile(null);
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 className="h-4 w-4" />
          Upload new version
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload new version</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <UploadDropzone file={file} onFile={setFile} disabled={add.isPending} />
          <p className="text-xs text-muted-foreground">
            The new file is hashed, encrypted, re-signed and anchored as a new version. Earlier
            versions are never overwritten.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={add.isPending}>
            {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Add version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
