"use client";

import { formatDateTime, getInitials } from "@/lib/utils";
import { Building2 } from "lucide-react";
import Image from "next/image";

interface VisitData {
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

export default function VisitorBadge({ visit }: { visit: VisitData }) {
  const hostName = visit.host?.name || visit.hostName || "—";

  return (
    <div
      id="visitor-badge"
      className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden w-full max-w-sm mx-auto shadow-md print:shadow-none"
    >
      {/* Header */}
      <div className="bg-blue-600 px-5 py-3 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-white" />
        <span className="font-bold text-white">VISITOR PASS</span>
        <span className="ml-auto text-blue-200 text-xs font-mono">{visit.badgeNumber}</span>
      </div>

      <div className="p-5 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
          {getInitials(`${visit.visitor.firstName} ${visit.visitor.lastName}`)}
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {visit.visitor.firstName} {visit.visitor.lastName}
          </h3>
          {visit.visitor.company && (
            <p className="text-sm text-gray-500">{visit.visitor.company}</p>
          )}

          <div className="mt-3 space-y-1 text-xs text-gray-600">
            <div><span className="font-medium">Purpose:</span> {visit.purpose}</div>
            <div><span className="font-medium">Host:</span> {hostName}</div>
            {visit.location && <div><span className="font-medium">Location:</span> {visit.location}</div>}
            <div><span className="font-medium">Check-in:</span> {formatDateTime(visit.checkIn)}</div>
          </div>
        </div>

        {/* QR Code */}
        {visit.qrCode && (
          <div className="flex-shrink-0">
            <Image src={visit.qrCode} alt="QR Code" width={64} height={64} />
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-5 py-2 text-center text-xs text-gray-400 border-t border-gray-100">
        This pass is valid for today only
      </div>
    </div>
  );
}
