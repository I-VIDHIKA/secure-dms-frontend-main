import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnchorBadge, HashText } from "@/components/security";
import { cn } from "@/lib/utils";
import { formatBytes, formatDateTime, personName } from "@/lib/format";
import type { DocumentVersion } from "@/types";

/** Click a row to choose which version the security panel (verify / signature / blockchain) shows. */
export function VersionList({
  versions,
  currentVersion,
  selected,
  onSelect,
}: {
  versions: DocumentVersion[];
  currentVersion: number;
  selected: number;
  onSelect: (version: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Uploader</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>SHA-256</TableHead>
            <TableHead>Blockchain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((v) => (
            <TableRow
              key={v.id}
              onClick={() => onSelect(v.version)}
              className={cn("cursor-pointer", v.version === selected && "bg-primary/5")}
              aria-selected={v.version === selected}
            >
              <TableCell>
                <span className="font-medium tabular-nums">v{v.version}</span>
                {v.version === currentVersion && (
                  <Badge variant="info" className="ml-2">
                    Current
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="hash">{v.filename}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(v.size)}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {personName(v.uploaded_by)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDateTime(v.uploaded_at)}
              </TableCell>
              <TableCell>
                <HashText value={v.sha256} />
              </TableCell>
              <TableCell>
                <AnchorBadge status={v.anchor.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
