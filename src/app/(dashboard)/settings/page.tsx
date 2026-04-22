"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { Save, Loader2, Building2, Mail, Shield, Bell } from "lucide-react";

const defaultSettings = {
  company_name: "",
  company_logo: "",
  company_address: "",
  company_phone: "",
  company_email: "",
  nda_required: "false",
  badge_expiry_hours: "24",
  max_visit_hours: "8",
  notify_host_on_checkin: "true",
  notify_host_on_checkout: "false",
  allow_self_checkin: "false",
  visitor_photo_required: "false",
};

const SECTIONS = [
  {
    id: "company",
    label: "Company",
    icon: Building2,
    fields: [
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "company_address", label: "Address", type: "text" },
      { key: "company_phone", label: "Phone", type: "text" },
      { key: "company_email", label: "Email", type: "email" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    fields: [
      { key: "nda_required", label: "Require NDA Signature", type: "checkbox" },
      { key: "visitor_photo_required", label: "Require Visitor Photo", type: "checkbox" },
      { key: "max_visit_hours", label: "Max Visit Duration (hours)", type: "number" },
      { key: "badge_expiry_hours", label: "Badge Expiry (hours)", type: "number" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    fields: [
      { key: "notify_host_on_checkin", label: "Notify host on check-in", type: "checkbox" },
      { key: "notify_host_on_checkout", label: "Notify host on check-out", type: "checkbox" },
    ],
  },
  {
    id: "checkin",
    label: "Check-in",
    icon: Mail,
    fields: [
      { key: "allow_self_checkin", label: "Allow self check-in kiosk", type: "checkbox" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...defaultSettings, ...d.settings }))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(key: string, value: string) {
    setSettings((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Settings" />
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 max-w-2xl space-y-5">
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
            Settings saved successfully!
          </div>
        )}

        {SECTIONS.map(({ id, label, icon: Icon, fields }) => (
          <div key={id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
              <Icon className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">{label}</h3>
            </div>
            <div className="space-y-4">
              {fields.map(({ key, label, type }) => (
                <div key={key} className={type === "checkbox" ? "flex items-center justify-between" : ""}>
                  {type === "checkbox" ? (
                    <>
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <button
                        onClick={() => handleChange(key, settings[key] === "true" ? "false" : "true")}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                          settings[key] === "true" ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
                            settings[key] === "true" ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={settings[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
