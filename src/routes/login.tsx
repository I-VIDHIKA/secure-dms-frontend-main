import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { login } from "@/api/auth";
import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Secure DMS" },
      { name: "description", content: "Sign in to Secure DMS with your departmental credentials." },
      { property: "og:title", content: "Sign in — Secure DMS" },
      { property: "og:description", content: "Access the tamper-proof document vault." },
    ],
  }),
  component: LoginPage,
});

// Demo accounts exist only when the backend runs with SEED_DEMO=true. The quick-login box is shown in dev builds only.
const DEMO_PASSWORD = "Secure@2026";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type Form = z.infer<typeof schema>;

const demos = [
  { role: "admin", email: "admin@securedms.gov.in", name: "DCP Rajesh Kumar", v: "danger" },
  {
    role: "investigator",
    email: "investigator@securedms.gov.in",
    name: "Insp. Priya Sharma",
    v: "info",
  },
  { role: "viewer", email: "viewer@securedms.gov.in", name: "Adv. Ananya Iyer", v: "muted" },
] as const;

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const doLogin = async (v: Form) => {
    setBusy(true);
    try {
      const res = await login(v.email, v.password);
      signIn(res.user, res.access_token);
      toast.success(`Welcome, ${res.user.name}`);
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="font-semibold">Secure DMS</span>
      </div>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Authorised personnel only. All sessions are audited.
      </p>
      <form onSubmit={handleSubmit(doLogin)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Official email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in
        </Button>
      </form>

      {import.meta.env.DEV && (
        <Card className="mt-6 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Demo accounts · quick login
          </p>
          <div className="mt-3 space-y-2">
            {demos.map((d) => (
              <button
                key={d.role}
                type="button"
                disabled={busy}
                onClick={() => doLogin({ email: d.email, password: DEMO_PASSWORD })}
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="hash text-muted-foreground">{d.email}</p>
                </div>
                <Badge variant={d.v} className="uppercase">
                  {d.role}
                </Badge>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Password for all demo accounts: <code className="hash">{DEMO_PASSWORD}</code>
          </p>
        </Card>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Request access
        </Link>
      </p>
    </AuthShell>
  );
}
