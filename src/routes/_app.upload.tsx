import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common";
import { AnchorBadge, HashText } from "@/components/security";
import { UploadDropzone } from "@/components/documents/UploadDropzone";
import { useCases, useUploadDocument } from "@/hooks/use-api";
import { requireAuth } from "@/lib/permissions";
import { CONFIDENTIALITY_LEVELS, DOCUMENT_TYPES, type DocumentDetail } from "@/types";

export const Route = createFileRoute("/_app/upload")({
  beforeLoad: () => requireAuth(["admin", "investigator"]),
  head: () => ({
    meta: [
      { title: "Upload document — Secure DMS" },
      { name: "description", content: "Hash, encrypt, sign and anchor a new case document." },
      { property: "og:title", content: "Upload document — Secure DMS" },
      { property: "og:description", content: "Secure document intake pipeline." },
    ],
  }),
  component: UploadPage,
});

const schema = z.object({
  caseId: z.string().min(1, "Select a case"),
  type: z.enum(DOCUMENT_TYPES, { errorMap: () => ({ message: "Select a document type" }) }),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(255),
  confidentiality: z.enum(CONFIDENTIALITY_LEVELS, {
    errorMap: () => ({ message: "Select a level" }),
  }),
});
type Form = z.infer<typeof schema>;

const STEPS = [
  ["SHA-256 fingerprint", "computed on the server from the exact bytes you send"],
  ["AES-256-GCM encryption", "a fresh key per file; only ciphertext is stored"],
  ["Ed25519 signature", "records who uploaded this version"],
  ["Saved and audited", "a new immutable version and a hash-chained audit entry"],
  ["Blockchain anchoring", "the hash is sent to the smart contract in the background"],
] as const;

function UploadPage() {
  const { data: cases = [] } = useCases();
  const openCases = cases.filter((c) => c.status === "open");
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DocumentDetail | null>(null);
  const busy = upload.isPending;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    if (!file) return toast.error("Attach a file to upload");
    setResult(null);
    setProgress(0);
    try {
      const doc = await upload.mutateAsync({
        case_id: v.caseId,
        title: v.title,
        doc_type: v.type,
        confidentiality: v.confidentiality,
        file,
        on_progress: setProgress,
      });
      setResult(doc);
    } catch {
      setProgress(0); // the mutation hook already showed the server's error message
    }
  };

  const restart = () => {
    reset();
    setFile(null);
    setProgress(0);
    setResult(null);
  };
  const first = result?.versions[0];

  return (
    <>
      <PageHeader
        title="Upload document"
        description="Files are fingerprinted, encrypted, signed and anchored before being stored."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <UploadDropzone file={file} onFile={setFile} disabled={busy || !!result} />
            {(busy || progress > 0) && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Transfer</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Case</Label>
                <Controller
                  control={control}
                  name="caseId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select case" />
                      </SelectTrigger>
                      <SelectContent>
                        {openCases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.case_number} · {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.caseId && (
                  <p className="text-xs text-destructive">{errors.caseId.message}</p>
                )}
                {!openCases.length && (
                  <p className="text-xs text-muted-foreground">
                    No open cases. Create or re-open a case first.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Document type</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                {...register("title")}
                disabled={busy}
                placeholder="e.g. Witness Statement – PW-5"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confidentiality level</Label>
              <Controller
                control={control}
                name="confidentiality"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFIDENTIALITY_LEVELS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.confidentiality && (
                <p className="text-xs text-destructive">{errors.confidentiality.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              {result ? (
                <Button type="button" variant="outline" onClick={restart}>
                  Upload another
                </Button>
              ) : (
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}Secure &amp; upload
                </Button>
              )}
            </div>
          </form>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">What happens to your file</h2>
            <ol className="mt-3 space-y-2.5 text-sm">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-medium">{title}</span>
                    <span className="text-muted-foreground"> — {text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          {result && first && (
            <Card className="border-success/40 bg-success/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{result.title} secured</p>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    SHA-256 <HashText value={first.sha256} head={12} tail={10} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Blockchain</span>
                    <AnchorBadge status={first.anchor.status} />
                  </div>
                  {first.anchor.status === "pending" && (
                    <p className="text-xs text-muted-foreground">
                      Anchoring runs in the background. Open the document to watch it complete.
                    </p>
                  )}
                  <Button asChild size="sm" className="mt-1">
                    <Link to="/documents/$id" params={{ id: result.id }}>
                      Open document
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
