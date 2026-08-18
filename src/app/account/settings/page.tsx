"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function SettingsPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifyBookings, setNotifyBookings] = useState(profile?.notify_booking_updates ?? true);
  const [notifyPromotions, setNotifyPromotions] = useState(profile?.notify_promotions ?? true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setNewPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim().slice(0, 120), phone: phone.trim().slice(0, 30) })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profile updated.");
  }

  async function toggleNotification(field: "notify_booking_updates" | "notify_promotions", value: boolean) {
    if (!user) return;
    if (field === "notify_booking_updates") setNotifyBookings(value);
    else setNotifyPromotions(value);

    setSavingNotifications(true);
    const payload =
      field === "notify_booking_updates" ? { notify_booking_updates: value } : { notify_promotions: value };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSavingNotifications(false);
    if (error) {
      // Roll back the toggle visually if the save failed.
      if (field === "notify_booking_updates") setNotifyBookings(!value);
      else setNotifyPromotions(!value);
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    setNewPasswordConfirm("");
    toast.success("Password updated.");
  }

  if (!user) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Account" title="Settings" />
        <div className="container-page py-12">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const isGoogleAccount = user.app_metadata?.provider === "google";

  return (
    <SiteLayout>
      <PageHeader eyebrow="Account" title="Settings" description="Manage your profile, notifications and security." />
      <div className="container-page max-w-2xl space-y-10 py-12">
        {/* Profile */}
        <section className="rounded-md border border-border p-6">
          <h2 className="font-display text-lg font-bold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your name and phone number are used to identify you at collection.
          </p>
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                maxLength={30}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email ?? ""} readOnly disabled />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </section>

        {/* Notifications */}
        <section className="rounded-md border border-border p-6">
          <h2 className="font-display text-lg font-bold">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what DI CHIES emails you about.
          </p>
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Booking updates</p>
                <p className="text-sm text-muted-foreground">
                  Get an email when your booking is confirmed or ready for collection.
                </p>
              </div>
              <Switch
                checked={notifyBookings}
                disabled={savingNotifications}
                onCheckedChange={(value) => void toggleNotification("notify_booking_updates", value)}
                aria-label="Toggle booking update emails"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Promotions &amp; deals</p>
                <p className="text-sm text-muted-foreground">
                  Hear about sales, new arrivals and special offers.
                </p>
              </div>
              <Switch
                checked={notifyPromotions}
                disabled={savingNotifications}
                onCheckedChange={(value) => void toggleNotification("notify_promotions", value)}
                aria-label="Toggle promotions emails"
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-md border border-border p-6">
          <h2 className="font-display text-lg font-bold">Security</h2>
          {isGoogleAccount ? (
            <p className="mt-1 text-sm text-muted-foreground">
              You signed in with Google, so there's no DI CHIES password to change here — manage your
              sign-in security from your Google account instead.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Change your password.</p>
              <form onSubmit={changePassword} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setNewPasswordConfirm(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}


export default SettingsPage;