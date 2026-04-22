"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime, getDuration, getInitials } from "@/lib/utils";
import { Search, LogOut, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Visit {
  id: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  purpose: string;
  hostName: string | null;
  location: string | null;
  badgeNumber: string | null;
  visitor: { id: string; firstName: string; lastName: string; company: string | null; isVIP: boolean };
  host: { name: string | null } | null;
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      search,
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/visits?${params}`);
    const data = await res.json();
    setVisits(data.visits);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchVisits, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchVisits, search]);

  async function handleCheckout(visitId: string) {
    setCheckingOut(visitId);
    try {
      await fetch(`/api/visits/${visitId}/checkout`, { method: "POST" });
      await fetchVisits();
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <div>
      <Header title="Visits" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search visitor, purpose, host..."
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {["", "CHECKED_IN", "CHECKED_OUT"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  statusFilter === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {s === "" ? "All" : s === "CHECKED_IN" ? "Active" : "Checked Out"}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 ml-auto">{total} total visits</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visitor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Purpose</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Host</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Check In</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Duration</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-400">No visits found</td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                            {getInitials(`${v.visitor.firstName} ${v.visitor.lastName}`)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-800">
                                {v.visitor.firstName} {v.visitor.lastName}
                              </span>
                              {v.visitor.isVIP && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            </div>
                            {v.visitor.company && <p className="text-xs text-gray-500">{v.visitor.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-600">{v.purpose}</td>
                      <td className="px-6 py-4 hidden lg:table-cell text-gray-500">
                        {v.host?.name || v.hostName || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDateTime(v.checkIn)}</td>
                      <td className="px-6 py-4 hidden sm:table-cell text-gray-500 text-xs">
                        {getDuration(v.checkIn, v.checkOut)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-6 py-4">
                        {v.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckout(v.id)}
                            disabled={checkingOut === v.id}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            {checkingOut === v.id ? "..." : "Check Out"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
