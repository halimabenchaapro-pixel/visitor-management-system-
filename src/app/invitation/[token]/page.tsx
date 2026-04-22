import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Building2, Calendar, User, MapPin } from "lucide-react";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { host: { select: { name: true, department: true } } },
  });

  if (!invitation) notFound();

  const companyName = (await prisma.setting.findUnique({ where: { key: "company_name" } }))?.value || "Our Company";

  const isPast = new Date(invitation.scheduledDate) < new Date();
  const isExpired = invitation.status === "EXPIRED";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{companyName}</h1>
          <p className="text-blue-200 text-sm mt-1">Visit Invitation</p>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Dear {invitation.visitorFirstName} {invitation.visitorLastName},
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            You have been invited to visit us by <strong>{invitation.host.name}</strong>.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{formatDateTime(invitation.scheduledDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Host: {invitation.host.name}{invitation.host.department ? ` — ${invitation.host.department}` : ""}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Purpose: {invitation.purpose}</span>
            </div>
          </div>

          {invitation.message && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-gray-700 italic">
              &ldquo;{invitation.message}&rdquo;
            </div>
          )}

          {isExpired || isPast ? (
            <div className="text-center py-2 text-sm text-gray-400">
              This invitation has expired or already passed.
            </div>
          ) : invitation.status === "ACCEPTED" ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-800 font-medium text-sm">
              You have accepted this invitation. See you soon!
            </div>
          ) : invitation.status === "REJECTED" ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-800 font-medium text-sm">
              You have declined this invitation.
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              Please show this page at reception on arrival.
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Ref: {invitation.token.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
