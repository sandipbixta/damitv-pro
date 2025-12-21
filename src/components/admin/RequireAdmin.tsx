import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AdminGateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; session: Session }
  | { status: "ok"; session: Session };

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // IMPORTANT: keep callback synchronous (no Supabase calls here)
      setSession(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => setInitializing(false));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(null);
      return;
    }

    let cancelled = false;

    // Defer Supabase calls to avoid any onAuthStateChange deadlocks
    setTimeout(() => {
      (async () => {
        try {
          const { data, error } = await supabase.rpc("has_role", {
            _user_id: session.user.id,
            _role: "admin",
          });

          if (cancelled) return;
          if (error) {
            setIsAdmin(false);
            return;
          }

          setIsAdmin(Boolean(data));
        } catch {
          if (cancelled) return;
          setIsAdmin(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const gateState: AdminGateState = useMemo(() => {
    if (initializing) return { status: "loading" };
    if (!session) return { status: "unauthenticated" };
    if (isAdmin === null) return { status: "loading" };
    if (!isAdmin) return { status: "forbidden", session };
    return { status: "ok", session };
  }, [initializing, isAdmin, session]);

  if (gateState.status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Checking access...</span>
        </div>
      </div>
    );
  }

  if (gateState.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>Please sign in to publish and manage blog posts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => navigate("/auth")}>Go to admin login</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Back to home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gateState.status === "forbidden") {
    const userId = gateState.session.user.id;
    const email = gateState.session.user.email ?? "";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Not an admin</CardTitle>
            <CardDescription>
              You are signed in{email ? ` as ${email}` : ""}, but this account doesn’t have admin permission to publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">Your user ID</p>
              <p className="text-sm font-mono break-all">{userId}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(userId);
                    toast.success("User ID copied");
                  } catch {
                    toast.error("Could not copy. Please copy it manually.");
                  }
                }}
              >
                Copy user ID
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth")}>Switch account</Button>
              <Button variant="outline" onClick={() => navigate("/")}>Back to home</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              To enable publishing, add this user as <span className="font-medium">admin</span> in the Supabase
              <span className="font-medium"> user_roles</span> table.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
