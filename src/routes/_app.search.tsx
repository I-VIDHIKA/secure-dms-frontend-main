import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileSearch, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common";
import { ConfidentialityBadge } from "@/components/security";
import { useCases, useSearch } from "@/hooks/use-api";
import { useDebounce } from "@/hooks/use-debounce";
import {
  CONFIDENTIALITY_LEVELS,
  DOCUMENT_TYPES,
  type Confidentiality,
  type DocumentType,
} from "@/types";

export const Route = createFileRoute("/_app/search")({
  head: () => ({
    meta: [
      { title: "Search — Secure DMS" },
      { name: "description", content: "Full-text search across all case documents with filters." },
      { property: "og:title", content: "Search — Secure DMS" },
      { property: "og:description", content: "Find documents by text, type, case and date." },
    ],
  }),
  component: SearchPage,
});

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const parts = text.split(
    new RegExp(`(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.trim().toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-warning/40 px-0.5 text-foreground">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

const ALL = "all";

function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState(ALL);
  const [caseId, setCaseId] = useState(ALL);
  const [conf, setConf] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const dq = useDebounce(q, 350);
  const { data: cases = [] } = useCases();
  const { data, isLoading, isFetching } = useSearch({
    q: dq,
    doc_type: type === ALL ? undefined : (type as DocumentType),
    case_id: caseId === ALL ? undefined : caseId,
    confidentiality: conf === ALL ? undefined : (conf as Confidentiality),
    date_from: from || undefined,
    date_to: to || undefined,
  });
  const clear = () => {
    setQ("");
    setType(ALL);
    setCaseId(ALL);
    setConf(ALL);
    setFrom("");
    setTo("");
  };

  return (
    <>
      <PageHeader
        title="Search"
        description="Search titles, contents, file names and case numbers."
      />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. a name, a phrase from a document, FIR-2026-0142…"
          className="h-12 pl-11 text-base"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <FilterSelect
          label="Type"
          value={type}
          onChange={setType}
          options={DOCUMENT_TYPES.map((t) => [t, t])}
        />
        <FilterSelect
          label="Case"
          value={caseId}
          onChange={setCaseId}
          options={cases.map((c) => [c.id, c.case_number])}
        />
        <FilterSelect
          label="Confidentiality"
          value={conf}
          onChange={setConf}
          options={CONFIDENTIALITY_LEVELS.map((t) => [t, t])}
        />
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" onClick={clear} className="w-full">
            Clear filters
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : !data?.results.length ? (
          <EmptyState
            icon={FileSearch}
            title="No matching documents"
            description="Adjust your search terms or filters."
          />
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {data.count} result{data.count === 1 ? "" : "s"}
            </p>
            <div className="overflow-x-auto rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((r) => (
                    <TableRow key={`${r.document_id}-${r.version}`} className="align-top">
                      <TableCell className="min-w-80 max-w-xl">
                        <Link
                          to="/documents/$id"
                          params={{ id: r.document_id }}
                          className="font-medium text-primary hover:underline"
                        >
                          <Highlight text={r.title} q={dq} />
                        </Link>
                        <div className="hash text-muted-foreground">
                          {r.doc_type} · <Highlight text={r.filename} q={dq} />
                        </div>
                        {r.snippet && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            <Highlight text={r.snippet} q={dq} />
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hash whitespace-nowrap">
                        <Highlight text={r.case_number} q={dq} />
                      </TableCell>
                      <TableCell>
                        <ConfidentialityBadge level={r.confidentiality} />
                      </TableCell>
                      <TableCell className="tabular-nums">v{r.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
