import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register as registerApi } from "@/api/auth";
import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Request access — Secure DMS" },
      { name: "description", content: "Register for a Secure DMS account." },
      { property: "og:title", content: "Request access — Secure DMS" },
      {
        property: "og:description",
        content: "Create an account for the tamper-proof document vault.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    name: z.string().trim().min(3, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    department: z.string().trim().min(2, "Enter your department").max(100),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type Form = z.infer<typeof schema>;

function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    try {
      const res = await registerApi({
        name: v.name,
        email: v.email,
        password: v.password,
        designation: v.department,
      });
      signIn(res.user, res.access_token);
      toast.success("Account created with viewer access");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const field = (id: keyof Form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...register(id)} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold">Request access</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        New accounts start with viewer access. An admin can elevate your role.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {field("name", "Full name")}
        {field("email", "Official email", "email")}
        {field("department", "Department / Unit")}
        {field("password", "Password", "password")}
        {field("confirm", "Confirm password", "password")}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
