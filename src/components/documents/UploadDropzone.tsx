import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

export function UploadDropzone({ file, onFile, disabled }: { file: File | null; onFile: (f: File | null) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      onClick={() => !disabled && !file && input.current?.click()}
      className={cn(
        "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors",
        over ? "border-primary bg-primary/5" : "border-input hover:border-primary/60 hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input ref={input} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      {file ? (
        <div className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 text-left">
          <FileUp className="h-6 w-6 text-primary" />
          <div>
            <p className="hash text-sm text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          {!disabled && (
            <button type="button" aria-label="Remove file" onClick={(e) => { e.stopPropagation(); onFile(null); }} className="rounded-sm p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <>
          <FileUp className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Drag and drop a file, or click to browse</p>
          <p className="text-xs text-muted-foreground">PDF, images, audio/video evidence · max 200 MB</p>
        </>
      )}
    </div>
  );
}
