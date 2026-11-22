import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnchorBadge, ConfidentialityBadge } from "@/components/security";
import { EmptyState } from "@/components/common";
import { formatDate } from "@/lib/format";
import type { Document } from "@/types";

export function DocumentTable({
  documents,
  showCase = true,
}: {
  documents: Document[];
  showCase?: boolean;
}) {
  if (!documents.length)
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Uploaded documents will appear here."
      />
    );
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            {showCase && <TableHead>Case</TableHead>}
            <TableHead>Classification</TableHead>
            <TableHead className="text-center">Ver.</TableHead>
            <TableHead>Blockchain</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                <Link
                  to="/documents/$id"
                  params={{ id: d.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {d.title}
                </Link>
                <div className="hash text-muted-foreground">{d.case_number}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">{d.doc_type}</TableCell>
              {showCase && (
                <TableCell>
                  <Link
                    to="/cases/$id"
                    params={{ id: d.case_id }}
                    className="hash hover:text-primary"
                  >
                    {d.case_number}
                  </Link>
                </TableCell>
              )}
              <TableCell>
                <ConfidentialityBadge level={d.confidentiality} />
              </TableCell>
              <TableCell className="text-center tabular-nums">v{d.current_version}</TableCell>
              <TableCell>
                <AnchorBadge status={d.anchor_status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(d.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
