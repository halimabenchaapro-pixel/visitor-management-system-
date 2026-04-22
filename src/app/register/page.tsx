"use client";

import { useEffect, useState } from "react";
import { UserCheck, Loader2, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";

interface Host {
  id: string;
  name: string | null;
  department: string | null;
}

type Step = "form" | "submitting" | "success" | "error";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [hosts, setHosts] = useState<Host[]>([]);
  const [result, setResult] = useState<{
    badgeNumber: string;
    qrCode: string;
    checkIn: string;
    visitor: { firstName: string; lastName: string; company: string | null };
    hostName: string | null;
    purpose: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    nationality: "",
    idType: "",
    idNumber: "",
    hostId: "",
    purpose: "",
    vehicleNumber: "",
    ndaSigned: false,
  });

  useEffect(() => {
    fetch("/api/register")
      .then((r) => r.json())
      .then((d) => setHosts(d.hosts || []));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("submitting");
    try {
      const selectedHost = hosts.find((h) => h.id === form.hostId);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hostName: selectedHost?.name || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed");
        setStep("error");
        return;
      }
      setResult({
        badgeNumber: data.visit.badgeNumber,
        qrCode: data.visit.qrCode,
        checkIn: data.visit.checkIn,
        visitor: data.visitor,
        hostName: selectedHost?.name || null,
        purpose: form.purpose,
      });
      setStep("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-blue-400 text-xs font-medium tracking-widest uppercase mb-1">adaaconsulting.ae</p>
          <h1 className="text-2xl font-bold text-white">Welcome to ADAA Consulting</h1>
          <p className="text-blue-300 text-sm mt-1">We&apos;re glad to have you here. Please fill in your details below to check in.</p>
        </div>

        {/* Success */}
        {step === "success" && result && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-green-600 px-6 py-5 text-center">
              <CheckCircle className="w-12 h-12 text-white mx-auto mb-2" />
              <h2 className="text-xl font-bold text-white">Welcome!</h2>
              <p className="text-green-100 text-sm">You have been successfully checked in</p>
            </div>
            <div className="p-6 text-center space-y-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {result.visitor.firstName} {result.visitor.lastName}
                </p>
                {result.visitor.company && (
                  <p className="text-gray-500 text-sm">{result.visitor.company}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Purpose</span>
                  <span className="font-medium text-gray-800">{result.purpose}</span>
                </div>
                {result.hostName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Host</span>
                    <span className="font-medium text-gray-800">{result.hostName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Badge #</span>
                  <span className="font-mono font-semibold text-blue-700 text-xs">
                    {result.badgeNumber}
                  </span>
                </div>
              </div>

              {result.qrCode && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-gray-400">Your visit QR code</p>
                  <Image
                    src={result.qrCode}
                    alt="Visit QR Code"
                    width={160}
                    height={160}
                    className="rounded-lg border border-gray-100 shadow-sm"
                  />
                </div>
              )}

              <p className="text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
                Please wait at reception — the receptionist has been notified and your host will be with you shortly.
              </p>

              <button
                onClick={() => {
                  setStep("form");
                  setResult(null);
                  setForm({
                    firstName: "", lastName: "", email: "", phone: "", company: "",
                    nationality: "", idType: "", idNumber: "", hostId: "", purpose: "",
                    vehicleNumber: "", ndaSigned: false,
                  });
                }}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
              >
                Register another visitor
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="font-bold text-gray-900 text-lg">Registration Failed</h2>
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3">{errorMsg}</p>
            <button
              onClick={() => setStep("form")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Form */}
        {(step === "form" || step === "submitting") && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Section: Personal Info */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Personal Information
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Smith"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+1 555 0100"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                      <input
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: ID */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Identification <span className="text-xs font-normal text-gray-400">(optional)</span>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Type</label>
                    <select
                      name="idType"
                      value={form.idType}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="NATIONAL_ID">National ID</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
                    <input
                      name="idNumber"
                      value={form.idNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
                    <input
                      name="nationality"
                      value={form.nationality}
                      onChange={handleChange}
                      placeholder="e.g. American"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Visit Details */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Visit Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Purpose of Visit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Who are you visiting?
                    </label>
                    <select
                      name="hostId"
                      value={form.hostId}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a person...</option>
                      {hosts.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}{h.department ? ` — ${h.department}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Vehicle Number <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      name="vehicleNumber"
                      value={form.vehicleNumber}
                      onChange={handleChange}
                      placeholder="e.g. ABC-1234"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* NDA / Terms */}
              <div className="px-6 py-4 border-b border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="ndaSigned"
                    checked={form.ndaSigned}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the company's visitor terms and conditions, and acknowledge that this visit may be recorded for security purposes.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="px-6 py-5">
                <button
                  type="submit"
                  disabled={step === "submitting"}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition text-base shadow-md"
                >
                  {step === "submitting" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Complete Check-in
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
