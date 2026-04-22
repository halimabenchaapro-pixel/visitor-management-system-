"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import { Search, UserCheck, Plus, Loader2, AlertTriangle, Star, Printer, QrCode } from "lucide-react";
import Link from "next/link";
import { getInitials, formatDateTime } from "@/lib/utils";
import VisitorBadge from "@/components/visitors/visitor-badge";

interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  isVIP: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
}

interface Host {
  id: string;
  name: string | null;
  department: string | null;
}

interface CompletedVisit {
  id: string;
  badgeNumber: string;
  qrCode: string;
  checkIn: string;
  visitor: { firstName: string; lastName: string; company: string | null };
  host: { name: string | null } | null;
  purpose: string;
  hostName: string | null;
  location: string | null;
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedId = searchParams.get("visitorId");

  const [step, setStep] = useState<"search" | "form" | "badge">(preselectedId ? "form" : "search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [completedVisit, setCompletedVisit] = useState<CompletedVisit | null>(null);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    hostId: "",
    hostName: "",
    purpose: "",
    purposeDetails: "",
    visitorType: "GUEST",
    expectedCheckOut: "",
    location: "",
    vehicleNumber: "",
    notes: "",
    ndaSigned: false,
  });

  useEffect(() => {
    fetch("/api/users?role=HOST&limit=100")
      .then((r) => r.json())
      .then((d) => setHosts(d.users || []));
  }, []);

  useEffect(() => {
    if (preselectedId) {
      fetch(`/api/visitors/${preselectedId}`)
        .then((r) => r.json())
        .then((d) => setSelectedVisitor(d.visitor));
    }
  }, [preselectedId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/visitors?search=${encodeURIComponent(searchQuery)}&limit=8`);
      const data = await res.json();
      setSearchResults(data.visitors || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function selectVisitor(v: Visitor) {
    setSelectedVisitor(v);
    setSearchQuery("");
    setSearchResults([]);
    setStep("form");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVisitor) return;
    setSubmitting(true);
    try {
      const selectedHost = hosts.find((h) => h.id === form.hostId);
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: selectedVisitor.id,
          ...form,
          hostName: selectedHost?.name || form.hostName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompletedVisit(data.visit);
      setStep("badge");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep("search");
    setSelectedVisitor(null);
    setCompletedVisit(null);
    setForm({
      hostId: "", hostName: "", purpose: "", purposeDetails: "",
      visitorType: "GUEST", expectedCheckOut: "", location: "",
      vehicleNumber: "", notes: "", ndaSigned: false,
    });
  }

  return (
    <div>
      <Header title="Check In" />
      <div className="p-6 max-w-2xl">
        {/* QR Code banner */}
        <Link
          href="/check-in/qr"
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 hover:bg-blue-100 transition group"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Enable Self Check-in via QR Code</p>
            <p className="text-xs text-blue-600">Visitors scan a QR code and fill in their own details</p>
          </div>
          <span className="text-xs text-blue-500 font-medium group-hover:underline">View QR →</span>
        </Link>

        {/* Step: Search */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Find Visitor</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, company..."
                  autoFocus
                  className="pl-9 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {searching && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-3 border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden">
                  {searchResults.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => selectVisitor(v)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                        {getInitials(`${v.firstName} ${v.lastName}`)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">{v.firstName} {v.lastName}</span>
                          {v.isVIP && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          {v.isBlacklisted && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{v.company || v.email || ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searching && (
                <div className="mt-4 text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No visitor found</p>
                  <button
                    onClick={() => router.push(`/visitors/new`)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline mx-auto"
                  >
                    <Plus className="w-4 h-4" /> Register new visitor
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Form */}
        {step === "form" && selectedVisitor && (
          <div className="space-y-4">
            {selectedVisitor.isBlacklisted && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Watchlist Alert</p>
                  <p className="text-xs">{selectedVisitor.blacklistReason || "This visitor is on the watchlist"}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {getInitials(`${selectedVisitor.firstName} ${selectedVisitor.lastName}`)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-800">{selectedVisitor.firstName} {selectedVisitor.lastName}</p>
                    {selectedVisitor.isVIP && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-gray-500">{selectedVisitor.company || selectedVisitor.email || ""}</p>
                </div>
                <button onClick={() => setStep("search")} className="ml-auto text-xs text-blue-600 hover:underline">
                  Change
                </button>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose of Visit *</label>
                  <select
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select purpose...</option>
                    <option>Meeting</option>
                    <option>Interview</option>
                    <option>Delivery</option>
                    <option>Maintenance</option>
                    <option>Vendor</option>
                    <option>Personal</option>
                    <option>Government</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Host</label>
                  <select
                    name="hostId"
                    value={form.hostId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select host...</option>
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}{h.department ? ` (${h.department})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Visitor Type</label>
                    <select
                      name="visitorType"
                      value={form.visitorType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GUEST">Guest</option>
                      <option value="CONTRACTOR">Contractor</option>
                      <option value="VENDOR">Vendor</option>
                      <option value="GOVERNMENT">Government</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Out</label>
                    <input
                      type="datetime-local"
                      name="expectedCheckOut"
                      value={form.expectedCheckOut}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location / Floor</label>
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Floor 3, Meeting Room A"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Number</label>
                    <input
                      name="vehicleNumber"
                      value={form.vehicleNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="ndaSigned" checked={form.ndaSigned} onChange={handleChange} className="rounded" />
                  <span className="text-sm text-gray-700">NDA / Terms signed</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  {submitting ? "Checking in..." : "Complete Check In"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step: Badge */}
        {step === "badge" && completedVisit && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Check-in Successful!</p>
                <p className="text-sm text-green-700">
                  {completedVisit.visitor.firstName} {completedVisit.visitor.lastName} checked in at {formatDateTime(completedVisit.checkIn)}
                </p>
              </div>
            </div>

            <VisitorBadge visit={completedVisit} />

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition"
              >
                <Printer className="w-4 h-4" /> Print Badge
              </button>
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
              >
                <UserCheck className="w-4 h-4" /> Check In Another Visitor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  );
}
