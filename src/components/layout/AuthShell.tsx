import type { ReactNode } from "react";
import { Fingerprint, Link2, Lock, ShieldCheck } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-sidebar-accent-foreground">Secure DMS</p>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Digital Evidence Vault</p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-sidebar-accent-foreground">
            Every FIR, statement and judgment — provably untouched.
          </h2>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              [Fingerprint, "SHA-256 fingerprint on every version"],
              [Lock, "AES-256 encryption at rest"],
              [ShieldCheck, "Ed25519 digital signatures"],
              [Link2, "Hashes anchored on blockchain"],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof Lock;
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="rounded-md bg-sidebar-accent p-2"><I className="h-4 w-4 text-sidebar-primary" /></span>
                  {t as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="hash text-sidebar-foreground/40">SIH26190 · Blockchain &amp; Cybersecurity</p>
      </aside>
      <main className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
