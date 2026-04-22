"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, Building, Phone, Mail } from "lucide-react";
import Link from "next/link";

interface Invitation {
  id: string;
  visitorFirstName: string;
  visitorLastName: string;
  visitorEmail: string;
  visitorCompany: string | null;
  visitorPhone: string | null;
  purpose: string;
  scheduledDate: string;
  scheduledEnd: string | null;
  status: string;
  host: { name: string | null; department: string | null };
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/invitations?${params}`);
    const data = await res.json();
    setInvitations(data.invitations);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this invitation?")) return;
    await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    fetchInvitations();
  }

  async function handleUpdateStatus(id: string, status: string) {
    await fetch(`/api/invitations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchInvitations();
  }

  return (
    <div>
      <Header title="Invitations" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {(["", "PENDING", "ACCEPTED", "REJECTED", "EXPIRED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  statusFilter === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <Link
            href="/invitations/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> New Invitation
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-48" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                </div>
              </div>
            ))
          ) : invitations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <p className="text-gray-400 text-sm">No invitations found</p>
              <Link href="/invitations/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                Create your first invitation
              </Link>
            </div>
          ) : (
            invitations.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                      {inv.visitorFirstName[0]}{inv.visitorLastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">
                          {inv.visitorFirstName} {inv.visitorLastName}
                        </h3>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                        {inv.visitorCompany && (
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{inv.visitorCompany}</span>
                        )}
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inv.visitorEmail}</span>
                        {inv.visitorPhone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inv.visitorPhone}</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">Purpose:</span> {inv.purpose} ·{" "}
                        <span className="font-medium text-gray-700">Scheduled:</span>{" "}
                        {formatDateTime(inv.scheduledDate)}{" "}
                        {inv.scheduledEnd && `– ${formatDateTime(inv.scheduledEnd)}`}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Host: {inv.host.name || "—"}{inv.host.department ? ` (${inv.host.department})` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inv.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(inv.id, "ACCEPTED")}
                          className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(inv.id, "REJECTED")}
                          className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
