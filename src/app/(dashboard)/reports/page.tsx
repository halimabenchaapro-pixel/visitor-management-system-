"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { formatDate } from "@/lib/utils";
import { Download, BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";

const COLORS = ["#2563EB", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#0891b2", "#db2777"];

interface ReportData {
  stats: { totalVisitors: number; currentlyIn: number; todayVisits: number; pendingInvitations: number };
  weeklyVisits: { date: string; count: number }[];
  monthlyVisits: { month: string; count: number }[];
  purposeBreakdown: { purpose: string; count: number }[];
  recentVisits: unknown[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [dateRange]);

  const weeklyData = data?.weeklyVisits.map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    visits: Number(d.count),
  })) ?? [];

  const monthlyData = data?.monthlyVisits.map((d) => ({
    month: d.month,
    visits: Number(d.count),
  })) ?? [];

  async function exportCSV() {
    const res = await fetch("/api/visits?limit=1000");
    const data = await res.json();
    const visits = data.visits;
    const headers = ["Visitor", "Company", "Purpose", "Host", "Check In", "Check Out", "Status", "Duration"];
    const rows = visits.map((v: {
      visitor: { firstName: string; lastName: string; company: string | null };
      purpose: string;
      host?: { name: string | null } | null;
      hostName?: string | null;
      checkIn: string;
      checkOut: string | null;
      status: string;
    }) => [
      `${v.visitor.firstName} ${v.visitor.lastName}`,
      v.visitor.company || "",
      v.purpose,
      v.host?.name || v.hostName || "",
      formatDate(v.checkIn),
      v.checkOut ? formatDate(v.checkOut) : "Active",
      v.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visits-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Header title="Reports & Analytics" />
      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Period:</span>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              {["7", "30", "90"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    dateRange === d ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Visitors", value: data?.stats.totalVisitors ?? 0, icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Active Now", value: data?.stats.currentlyIn ?? 0, icon: TrendingUp, color: "text-green-600 bg-green-50" },
            { label: "Today", value: data?.stats.todayVisits ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Pending Invites", value: data?.stats.pendingInvitations ?? 0, icon: BarChart3, color: "text-purple-600 bg-purple-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${color.split(" ")[1]} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color.split(" ")[0]}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block w-10 h-7 bg-gray-100 rounded animate-pulse" /> : value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily visits bar chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Daily Visits (Last 7 days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="visits" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Purpose breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Visit Purposes</h3>
            {data?.purposeBreakdown && data.purposeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.purposeBreakdown} dataKey="count" nameKey="purpose" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                    {data.purposeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data</div>
            )}
          </div>

          {/* Purpose table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Purpose Breakdown</h3>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1 h-3 bg-gray-100 rounded animate-pulse" />
                    <div className="w-8 h-3 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))
              ) : (
                data?.purposeBreakdown.map((p, i) => {
                  const total = data.purposeBreakdown.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                  return (
                    <div key={p.purpose}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{p.purpose}</span>
                        <span className="font-medium text-gray-800">{p.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
