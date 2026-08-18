"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  notify_booking_updates: boolean;
  notify_promotions: boolean;
  created_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return (data as unknown as Profile) ?? null;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return data.map((row) => row.role as string);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile: profile ?? null,
        isAdmin: (roles ?? []).includes("admin"),
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signOutCompletely(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}

// Looks up whether a just-signed-in user is an admin and returns where they
// should land. Used right after sign-in (password or OAuth) instead of
// waiting on the AuthProvider's own queries, which may not have refreshed
// yet at that exact moment.
export async function resolveAuthDestination(userId: string | undefined): Promise<string> {
  if (!userId) return "/account";
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return "/account";
  const isAdmin = (data ?? []).some((row) => row.role === "admin");
  return isAdmin ? "/admin" : "/account";
}

// Turns a name or email into a 1-2 letter avatar label, e.g.
// "Glass Kid" -> "GK", "glasskid01@gmail.com" -> "GL".
export function getInitials(profile: Profile | null, user: User | null): string {
  const fullName = profile?.full_name?.trim() || (user?.user_metadata?.full_name as string | undefined)?.trim();
  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }
  const email = user?.email;
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}