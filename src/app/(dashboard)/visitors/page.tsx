"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";
import {
  Search,
  Plus,
  Filter,
  Star,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  isVIP: boolean;
  isBlacklisted: boolean;
  createdAt: string;
  _count: { visits: number };
  visits: { checkIn: string; status: string }[];
}

export default function VisitorsPage() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"" | "vip" | "blacklisted">("");
  const [loading, setLoading] = useState(true);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      search,
      ...(filter === "vip" && { vip: "true" }),
      ...(filter === "blacklisted" && { blacklisted: "true" }),
    });
    try {
      const res = await fetch(`/api/visitors?${params}`);
      const data = await res.json();
      setVisitors(data.visitors);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    const t = setTimeout(fetchVisitors, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchVisitors, search]);

  return (
    <div>
      <Header title="Visitors" />
      <div className="p-6 space-y-4">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, email, company..."
                className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
              {(["", "vip", "blacklisted"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                    filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f === "" ? "All" : f === "vip" ? "VIP" : "Blocked"}
                </button>
              ))}
            </div>
          </div>
          <Link
            href="/visitors/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Visitor
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visitor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Visits</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Registered</th>
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
                ) : visitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                      No visitors found
                    </td>
                  </tr>
                ) : (
                  visitors.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                            {getInitials(`${v.firstName} ${v.lastName}`)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-800">
                                {v.firstName} {v.lastName}
                              </span>
                              {v.isVIP && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              {v.isBlacklisted && <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        {v.email || v.phone || "—"}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-gray-500">
                        {v.company || "—"}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="font-semibold text-gray-800">{v._count.visits}</span>
                      </td>
                      <td className="px-6 py-4">
                        {v.isBlacklisted ? (
                          <StatusBadge status="CANCELLED" />
                        ) : v.visits[0]?.status === "CHECKED_IN" ? (
                          <StatusBadge status="CHECKED_IN" />
                        ) : (
                          <span className="text-xs text-gray-400">Not checked in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-gray-500">
                        {formatDate(v.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/visitors/${v.id}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/visitors/${v.id}?edit=true`)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
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
