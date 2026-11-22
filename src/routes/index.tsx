import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Secure DMS — Evidence Vault" },
      { name: "description", content: "Secure DMS: tamper-proof document management for police, courts and investigators." },
      { property: "og:title", content: "Secure DMS — Evidence Vault" },
      { property: "og:description", content: "Tamper-proof document management for police, courts and investigators." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
