import { Link, useRouterState } from "@tanstack/react-router";
import { FileSearch, FolderKanban, LayoutDashboard, ScrollText, ShieldCheck, Upload, Users } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth";
import { can, type Permission } from "@/lib/permissions";

const items: { title: string; url: string; icon: typeof Upload; perm?: Permission }[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cases", url: "/cases", icon: FolderKanban },
  { title: "Upload", url: "/upload", icon: Upload, perm: "upload" },
  { title: "Search", url: "/search", icon: FileSearch },
  { title: "Audit Log", url: "/audit", icon: ScrollText, perm: "viewAudit" },
  { title: "Users", url: "/users", icon: Users, perm: "manageUsers" },
];

export function AppSidebar() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((i) => !i.perm || can(user?.role, i.perm));
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-semibold text-sidebar-accent-foreground">Secure DMS</p>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Evidence Vault</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild tooltip={i.title} isActive={path === i.url || path.startsWith(i.url + "/")}>
                    <Link to={i.url}>
                      <i.icon className="h-4 w-4" />
                      <span>{i.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <p className="px-2 text-[10px] leading-relaxed text-sidebar-foreground/50">
          SIH26190 · Blockchain &amp; Cybersecurity<br />All actions are hash-chained and audited.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
