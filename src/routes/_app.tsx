import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { requireAuth } from "@/lib/permissions";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: AppLayout,
});
