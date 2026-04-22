import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail, buildInvitationEmail } from "@/lib/email";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (session.user.role === "RECEPTIONIST") where.hostId = session.user.id;

  const [invitations, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      include: { host: { select: { name: true, department: true } } },
      orderBy: { scheduledDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.invitation.count({ where }),
  ]);

  return NextResponse.json({ invitations, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    visitorFirstName,
    visitorLastName,
    visitorEmail,
    visitorPhone,
    visitorCompany,
    purpose,
    scheduledDate,
    scheduledEnd,
    message,
  } = body;

  if (!visitorFirstName || !visitorLastName || !visitorEmail || !scheduledDate || !purpose) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const invitation = await prisma.invitation.create({
    data: {
      hostId: session.user.id,
      visitorFirstName,
      visitorLastName,
      visitorEmail,
      visitorPhone,
      visitorCompany,
      purpose,
      scheduledDate: new Date(scheduledDate),
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
      message,
    },
    include: { host: { select: { name: true } } },
  });

  // Send invitation email
  if (visitorEmail) {
    sendEmail({
      to: visitorEmail,
      subject: `Invitation to visit ${process.env.COMPANY_NAME || "Our Company"}`,
      html: buildInvitationEmail({
        visitorName: `${visitorFirstName} ${visitorLastName}`,
        hostName: invitation.host.name || "Your Host",
        companyName: process.env.COMPANY_NAME || "Our Company",
        scheduledDate: format(new Date(scheduledDate), "MMMM d, yyyy 'at' h:mm a"),
        location: "Reception",
        token: invitation.token,
        baseUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ invitation }, { status: 201 });
}
