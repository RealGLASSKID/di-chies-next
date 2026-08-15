"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back to DI CHIES.");
    router.push("/account");
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message);
    }
    // On success the browser is redirected to Google, so no further
    // state update happens here.
  }

  return (
    <SiteLayout>
      <div className="container-page flex justify-center py-16">
        <div className="w-full max-w-md rounded-md border border-border p-8">
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your bookings and collection slots.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full gap-2"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="h-4 w-4" />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to DI CHIES?{" "}
            <Link href="/register" className="font-semibold text-foreground underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}


export default LoginPage;