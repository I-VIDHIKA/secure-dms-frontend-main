import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout as logoutApi } from "@/api/auth";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";
import { useBlockchainStatus } from "@/hooks/use-api";
import { initials } from "@/lib/format";

const roleVariant = { admin: "danger", investigator: "info", viewer: "muted" } as const;

function ChainChip() {
  const { data, isLoading } = useBlockchainStatus();
  if (isLoading) return <Badge variant="muted">Blockchain…</Badge>;
  if (!data?.configured) return <Badge variant="muted">Blockchain not configured</Badge>;
  if (data.error || !data.connected)
    return (
      <Badge variant="warning" title={data.error ?? undefined}>
        {data.network ?? "Chain"} unreachable
      </Badge>
    );
  return (
    <Badge
      variant="success"
      title={data.contract_address ? `Contract ${data.contract_address}` : undefined}
    >
      {data.network ?? "Blockchain"} connected
      {data.latest_block ? ` · block ${data.latest_block}` : ""}
    </Badge>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      /* the token may already be invalid; sign out locally anyway */
    }
    await qc.cancelQueries();
    qc.clear();
    signOut();
    navigate({ to: "/login", replace: true });
  };
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="hidden md:block">
        <ChainChip />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {user && (
          <Badge variant={roleVariant[user.role]} className="uppercase tracking-wider">
            {user.role}
          </Badge>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {user ? initials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p>{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
              {user?.designation && (
                <p className="mt-1 text-xs font-normal text-muted-foreground">{user.designation}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
