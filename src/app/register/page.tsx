"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.name.trim().slice(0, 120), phone: form.phone.trim().slice(0, 30) },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email to confirm your DI CHIES account.");
  }

  async function handleGoogleSignUp() {
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
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          {sent ? (
            <p className="mt-4 text-sm text-muted-foreground">
              We've emailed you a confirmation link. Once confirmed you can sign in and book collections.
            </p>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full gap-2"
                disabled={googleLoading}
                onClick={handleGoogleSignUp}
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
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input
                    id="reg-name"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reg-phone">Phone</Label>
                  <Input
                    id="reg-phone"
                    required
                    maxLength={30}
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-foreground underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}


export default RegisterPage;