"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badge";
import { formatTime, getDuration, getInitials } from "@/lib/utils";
import {
  Users,
  UserCheck,
  CalendarDays,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

const PIE_COLORS = ["#2563EB", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#0891b2"];

interface DashboardData {
  stats: {
    totalVisitors: number;
    currentlyIn: number;
    todayVisits: number;
    pendingInvitations: number;
  };
  weeklyVisits: { date: string; count: number }[];
  monthlyVisits: { month: string; count: number }[];
  purposeBreakdown: { purpose: string; count: number }[];
  recentVisits: {
    id: string;
    checkIn: string;
    checkOut: string | null;
    status: string;
    hostName: string | null;
    purpose: string;
    visitor: { firstName: string; lastName: string; company: string | null; photo: string | null };
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const weeklyChartData =
    data?.weeklyVisits.map((d) => ({
      date: format(parseISO(d.date), "EEE"),
      visits: Number(d.count),
    })) ?? [];

  const statCards = [
    {
      label: "Total Visitors",
      value: data?.stats.totalVisitors ?? 0,
      icon: Users,
      color: "bg-blue-500",
      change: "+12% this month",
    },
    {
      label: "Currently Inside",
      value: data?.stats.currentlyIn ?? 0,
      icon: UserCheck,
      color: "bg-green-500",
      change: "Active now",
    },
    {
      label: "Today's Visits",
      value: data?.stats.todayVisits ?? 0,
      icon: Clock,
      color: "bg-amber-500",
      change: format(new Date(), "MMMM d"),
    },
    {
      label: "Pending Invitations",
      value: data?.stats.pendingInvitations ?? 0,
      icon: CalendarDays,
      color: "bg-purple-500",
      change: "Awaiting response",
    },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      value.toLocaleString()
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{change}</p>
                </div>
                <div className={`${color} p-3 rounded-xl`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Weekly Visits Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Visits This Week</h3>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyChartData}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#visitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Purpose Breakdown */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Visit Purposes</h3>
            {data?.purposeBreakdown && data.purposeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.purposeBreakdown}
                    dataKey="count"
                    nameKey="purpose"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    strokeWidth={2}
                  >
                    {data.purposeBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Currently Checked In */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Currently Inside</h3>
            <Link
              href="/visits"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-40 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                  </div>
                </div>
              ))
            ) : data?.recentVisits.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                No visitors currently inside
              </div>
            ) : (
              data?.recentVisits.map((visit) => (
                <div key={visit.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                    {getInitials(`${visit.visitor.firstName} ${visit.visitor.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {visit.visitor.firstName} {visit.visitor.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {visit.visitor.company && `${visit.visitor.company} · `}
                      {visit.purpose}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{formatTime(visit.checkIn)}</p>
                    <p className="text-xs text-gray-400">{getDuration(visit.checkIn)}</p>
                  </div>
                  <StatusBadge status={visit.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
