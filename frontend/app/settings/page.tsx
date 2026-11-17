"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LuBuilding2, LuInfo } from "react-icons/lu";
import { toast } from "sonner";
import { authFetch } from "@/services/api";

type Organization = {
  _id: string;
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
};

export default function SettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authFetch<Organization>("/organizations/current");
      setOrganization(result);
      setName(result.name);
      setContactEmail(result.contactEmail || "");
      setPhone(result.phone || "");
      setAddress(result.address || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSettings);
  }, [loadSettings]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await authFetch<Organization>("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({ name, contactEmail, phone, address }),
      });
      setOrganization(updated);
      toast.success("Business settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="module-page"><div className="customer-detail-skeleton" /></div>;

  return (
    <div className="module-page">
      <div className="module-heading"><div><span className="eyebrow">WORKSPACE PREFERENCES</span><h1>Settings</h1><p>Manage the business details associated with your organization.</p></div></div>
      <section className="settings-panel organization-settings">
        <div className="settings-panel-heading"><span className="settings-icon"><LuBuilding2 /></span><div><h2>Business information</h2><p>Used to identify your workspace and in customer correspondence.</p></div></div>
        <form onSubmit={saveSettings} className="settings-form organization-form">
          <label>Business name<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Business email<input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} /></label>
          <label>Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label className="settings-address">Business address<textarea rows={3} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
          <div className="settings-info"><LuInfo /><span>Payments currently use Razorpay in INR. Currency and tax configuration are not offered until they can be consistently applied to invoices and payment verification.</span></div>
          <div className="settings-save-row"><span>{organization?._id ? `Workspace ID: ${organization._id}` : ""}</span><button type="submit" className="dashboard-primary-action" disabled={saving}>{saving ? "Saving..." : "Save business details"}</button></div>
        </form>
      </section>
    </div>
  );
}
