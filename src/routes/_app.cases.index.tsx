import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderKanban, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common";
import { useCases, useCreateCase, useUserDirectory } from "@/hooks/use-api";
import { useCurrentUser } from "@/contexts/auth";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/cases/")({
  head: () => ({
    meta: [
      { title: "Cases — Secure DMS" },
      {
        name: "description",
        content: "All registered cases with assigned officers and document counts.",
      },
      { property: "og:title", content: "Cases — Secure DMS" },
      { property: "og:description", content: "Browse and manage investigation cases." },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const user = useCurrentUser();
  const { data: cases, isLoading } = useCases();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const rows = useMemo(
    () =>
      (cases ?? []).filter(
        (c) =>
          (status === "all" || c.status === status) &&
          `${c.case_number} ${c.title}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [cases, q, status],
  );

  return (
    <>
      <PageHeader
        title="Cases"
        description="Investigations and their evidence files."
        actions={can(user.role, "createCase") && <NewCaseDialog />}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by case number or title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <LoadingSkeleton />
      ) : !rows.length ? (
        <EmptyState
          icon={FolderKanban}
          title="No cases match"
          description="Cases appear here once you are assigned to them. Try a different search or status filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Docs</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/cases/$id"
                      params={{ id: c.id }}
                      className="hash text-sm font-medium text-primary hover:underline"
                    >
                      {c.case_number}
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-56">{c.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "open" ? "success" : "muted"}
                      className="uppercase"
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.assigned.map((p) => p.name).join(", ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.document_count}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(c.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

const schema = z.object({
  case_number: z.string().trim().min(3, "Enter the case number, e.g. FIR-2026-0200").max(64),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().trim().max(5000),
  assigned_user_ids: z.array(z.string()),
});
type Form = z.infer<typeof schema>;

function NewCaseDialog() {
  const me = useCurrentUser();
  const [open, setOpen] = useState(false);
  const { data: directory = [] } = useUserDirectory();
  const create = useCreateCase();
  const people = directory.filter((u) => u.id !== me.id);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { assigned_user_ids: [], description: "" },
  });
  const selected = watch("assigned_user_ids");
  const onSubmit = (v: Form) =>
    create.mutate(v, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register new case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Case number</Label>
            <Input {...register("case_number")} placeholder="e.g. FIR-2026-0200" />
            {errors.case_number && (
              <p className="text-xs text-destructive">{errors.case_number.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="e.g. Cyber extortion – Koramangala" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea rows={3} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Also assign (you are added automatically)</Label>
            <div className="grid gap-1.5 rounded-md border p-3 sm:grid-cols-2">
              {people.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(o.id)}
                    onCheckedChange={(c) =>
                      setValue(
                        "assigned_user_ids",
                        c ? [...selected, o.id] : selected.filter((x) => x !== o.id),
                        { shouldValidate: true },
                      )
                    }
                  />
                  <span>
                    {o.name}
                    <span className="ml-1 text-xs text-muted-foreground">({o.role})</span>
                  </span>
                </label>
              ))}
              {!people.length && (
                <p className="text-xs text-muted-foreground">No other users to assign.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Create case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
