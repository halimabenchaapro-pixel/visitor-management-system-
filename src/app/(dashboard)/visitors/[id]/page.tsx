"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatDateTime, getDuration, getInitials } from "@/lib/utils";
import {
  ArrowLeft, Star, ShieldAlert, Pencil, Save, X, Loader2, UserCheck, Phone, Mail, Building, Globe, CreditCard
} from "lucide-react";
import Link from "next/link";

interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  nationality: string | null;
  idType: string | null;
  idNumber: string | null;
  isVIP: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  notes: string | null;
  createdAt: string;
  visits: {
    id: string;
    checkIn: string;
    checkOut: string | null;
    status: string;
    purpose: string;
    hostName: string | null;
    host: { name: string | null } | null;
  }[];
}

export default function VisitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get("edit") === "true");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Visitor>>({});

  const fetchVisitor = useCallback(async () => {
    const res = await fetch(`/api/visitors/${id}`);
    const data = await res.json();
    setVisitor(data.visitor);
    setForm(data.visitor);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchVisitor(); }, [fetchVisitor]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/visitors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await fetchVisitor();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Visitor Profile" />
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!visitor) return <div className="p-6">Visitor not found</div>;

  return (
    <div>
      <Header title="Visitor Profile" />
      <div className="p-6 max-w-4xl space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/visitors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setForm(visitor); }}
                  className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}
            <Link
              href={`/check-in?visitorId=${visitor.id}`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <UserCheck className="w-3.5 h-3.5" /> Check In
            </Link>
          </div>
        </div>

        {visitor.isBlacklisted && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Watchlist Alert</p>
              {visitor.blacklistReason && <p className="text-sm">{visitor.blacklistReason}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold mx-auto mb-4">
              {getInitials(`${visitor.firstName} ${visitor.lastName}`)}
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="font-bold text-gray-900 text-lg">
                {visitor.firstName} {visitor.lastName}
              </h2>
              {visitor.isVIP && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
            </div>
            {visitor.company && <p className="text-sm text-gray-500">{visitor.company}</p>}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-left">
              {visitor.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {visitor.email}
                </div>
              )}
              {visitor.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {visitor.phone}
                </div>
              )}
              {visitor.company && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  {visitor.company}
                </div>
              )}
              {visitor.nationality && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {visitor.nationality}
                </div>
              )}
              {visitor.idNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  {visitor.idType}: {visitor.idNumber}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">Registered {formatDate(visitor.createdAt)}</p>
          </div>

          {/* Edit / Details */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {editing ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">Edit Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(["firstName", "lastName", "email", "phone", "company", "nationality", "idNumber"] as const).map((field) => (
                    <div key={field} className={field === "company" || field === "email" ? "col-span-2" : ""}>
                      <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                        {field.replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        name={field}
                        value={(form[field] as string) || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={(form.notes as string) || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isVIP" checked={!!form.isVIP} onChange={handleChange} className="rounded" />
                    <span className="text-sm text-gray-700">VIP</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isBlacklisted" checked={!!form.isBlacklisted} onChange={handleChange} className="rounded" />
                    <span className="text-sm text-gray-700">Blocked</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Visit History</h3>
                <div className="space-y-2">
                  {visitor.visits.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4">No visits yet</p>
                  ) : (
                    visitor.visits.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{visit.purpose}</p>
                          <p className="text-xs text-gray-500">
                            Host: {visit.host?.name || visit.hostName || "—"} · {formatDateTime(visit.checkIn)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{getDuration(visit.checkIn, visit.checkOut)}</span>
                          <StatusBadge status={visit.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
