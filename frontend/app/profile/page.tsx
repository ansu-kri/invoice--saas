"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LuShieldCheck, LuUserRound } from "react-icons/lu";
import { toast } from "sonner";
import { authFetch } from "@/services/api";

type Profile = {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authFetch<Profile>("/users/me");
      setProfile(result);
      setName(result.name);
      setEmail(result.email);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadProfile);
  }, [loadProfile]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authFetch<Profile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      setProfile(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new Event("invoice-auth-change"));
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await authFetch("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="module-page"><div className="customer-detail-skeleton" /></div>;

  return (
    <div className="module-page">
      <div className="module-heading"><div><span className="eyebrow">ACCOUNT</span><h1>My profile</h1><p>Manage your personal information and account security.</p></div></div>
      <div className="settings-grid">
        <section className="settings-panel">
          <div className="settings-panel-heading"><span className="settings-icon"><LuUserRound /></span><div><h2>Personal information</h2><p>Update your account name and email.</p></div></div>
          <form onSubmit={saveProfile} className="settings-form">
            <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <div className="settings-account-meta"><span>Role</span><strong>{profile?.role || "Member"}</strong><span>Member since</span><strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</strong></div>
            <button type="submit" className="dashboard-primary-action" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save profile"}</button>
          </form>
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading"><span className="settings-icon settings-icon-green"><LuShieldCheck /></span><div><h2>Change password</h2><p>Confirm your current password before setting a new one.</p></div></div>
          <form onSubmit={changePassword} className="settings-form">
            <label>Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label>New password<input required type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><small>Use at least 8 characters.</small></label>
            <button type="submit" className="settings-secondary-action" disabled={savingPassword}>{savingPassword ? "Updating..." : "Update password"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
