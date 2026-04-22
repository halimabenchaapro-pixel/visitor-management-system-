"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/header";
import { formatDate } from "@/lib/utils";
import { Search, Plus, Trash2, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

interface WatchlistEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  company: string | null;
  reason: string;
  addedBy: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    idNumber: "", company: "", reason: "", notes: "",
  });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(`/api/watchlist?${params}`);
    const data = await res.json();
    setEntries(data.entries);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchEntries, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchEntries, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", idNumber: "", company: "", reason: "", notes: "" });
      fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove from watchlist?")) return;
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/watchlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchEntries();
  }

  return (
    <div>
      <Header title="Security Watchlist" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, ID..."
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add to Watchlist
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-800">Add to Security Watchlist</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                  <input value={form.idNumber} onChange={(e) => setForm(p => ({ ...p, idNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} required
                  placeholder="Reason for watchlist inclusion..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  {submitting ? "Adding..." : "Add to Watchlist"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Person</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Added By</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
                  ))}</tr>
                ))
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400">No watchlist entries</td></tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xs font-semibold">
                          {e.firstName[0]}{e.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{e.firstName} {e.lastName}</p>
                          {e.company && <p className="text-xs text-gray-500">{e.company}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500 text-xs">
                      {e.email || e.idNumber || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs">
                      <p className="truncate text-sm">{e.reason}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-500 text-xs">{e.addedBy}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-500 text-xs">{formatDate(e.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(e.id, e.isActive)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          e.isActive ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {e.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(e.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">{total} entries</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 text-sm">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
