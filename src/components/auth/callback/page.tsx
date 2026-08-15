"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { resolveAuthDestination } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Google (and any other OAuth provider) redirects the whole browser back
// here after the user approves sign-in. The Supabase client automatically
// picks the session up out of the URL on load; we just wait for it, then
// decide where the user actually belongs.
function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    async function go(userId: string) {
      if (handled.current) return;
      handled.current = true;
      const destination = await resolveAuthDestination(userId);
      router.replace(destination);
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void go(session.user.id);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void go(data.session.user.id);
    });

    // If nothing establishes a session within a few seconds (e.g. the user
    // cancelled on Google's side), don't leave them stuck on a blank page.
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        router.replace("/login");
      }
    }, 8000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <SiteLayout>
      <div className="container-page flex min-h-[40vh] items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </SiteLayout>
  );
}

export default AuthCallbackPage;