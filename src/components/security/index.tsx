import { useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Link2,
  Link2Off,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Confidentiality, DocumentAnchor, IntegrityStatus } from "@/types";

export function HashText({
  value,
  head = 8,
  tail = 6,
  className,
}: {
  value: string;
  head?: number;
  tail?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const short =
    value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <code className="hash rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground" title={value}>
        {short}
      </code>
      <button
        type="button"
        aria-label="Copy hash"
        className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}

export function VerifyBadge({ status }: { status: IntegrityStatus | "checking" }) {
  if (status === "checking")
    return (
      <Badge variant="muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verifying…
      </Badge>
    );
  if (status === "verified")
    return (
      <Badge variant="success">
        <ShieldCheck className="h-3 w-3" />
        Integrity OK
      </Badge>
    );
  if (status === "tampered")
    return (
      <Badge variant="danger" className="font-bold tracking-wide">
        <ShieldAlert className="h-3 w-3" />
        TAMPERED
      </Badge>
    );
  return (
    <Badge variant="warning">
      <ShieldQuestion className="h-3 w-3" />
      Unverified
    </Badge>
  );
}

export function SignatureBadge({ valid }: { valid: boolean | null }) {
  if (valid === null) return <Badge variant="muted">Not checked</Badge>;
  return valid ? (
    <Badge variant="success">
      <Check className="h-3 w-3" />
      Valid
    </Badge>
  ) : (
    <Badge variant="danger">Invalid</Badge>
  );
}

const anchorLabel: Record<
  DocumentAnchor["status"],
  { text: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  anchored: { text: "Anchored", variant: "success" },
  pending: { text: "Anchoring…", variant: "warning" },
  failed: { text: "Anchor failed", variant: "danger" },
  not_configured: { text: "Not on-chain", variant: "muted" },
};
export function AnchorBadge({ status }: { status: DocumentAnchor["status"] }) {
  const a = anchorLabel[status] ?? anchorLabel.not_configured;
  return (
    <Badge variant={a.variant}>
      {status === "pending" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Link2 className="h-3 w-3" />
      )}
      {a.text}
    </Badge>
  );
}

const confVariant: Record<Confidentiality, "muted" | "info" | "warning" | "danger"> = {
  Public: "muted",
  Restricted: "info",
  Confidential: "warning",
  "Top Secret": "danger",
};
export function ConfidentialityBadge({ level }: { level: Confidentiality }) {
  return (
    <Badge variant={confVariant[level]} className="uppercase tracking-wide text-[10px]">
      {level}
    </Badge>
  );
}

export function ChainStatus({
  valid,
  checked,
  brokenAt,
  reason,
  loading,
  onVerify,
}: {
  valid: boolean | null;
  checked?: number;
  brokenAt?: string | number | null;
  reason?: string | null;
  loading: boolean;
  onVerify: () => void;
}) {
  const bad = valid === false;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between",
        bad ? "border-destructive/40 bg-destructive/10" : "border-success/40 bg-success/10",
      )}
    >
      <div className="flex items-center gap-3">
        {bad ? (
          <Link2Off className="h-6 w-6 text-destructive" />
        ) : (
          <Link2 className="h-6 w-6 text-success" />
        )}
        <div>
          <p
            className={cn("font-semibold tracking-wide", bad ? "text-destructive" : "text-success")}
          >
            Audit chain: {bad ? "BROKEN" : "VALID"}
          </p>
          <p className="text-xs text-muted-foreground">
            {valid === null
              ? "Each entry commits to the previous entry's hash. Checking…"
              : bad
                ? `Hash link broken at entry #${brokenAt}${reason ? ` — ${reason}` : ""}`
                : `${checked} entries verified from the first entry`}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onVerify} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Verify Chain
      </Button>
    </div>
  );
}
