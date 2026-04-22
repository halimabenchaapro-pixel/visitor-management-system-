import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateBadgeNumber } from "@/lib/utils";
import { createQRCode } from "@/lib/qrcode";
import { sendEmail, buildCheckInNotificationEmail } from "@/lib/email";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { visitor: { firstName: { contains: search } } },
      { visitor: { lastName: { contains: search } } },
      { visitor: { company: { contains: search } } },
      { purpose: { contains: search } },
      { hostName: { contains: search } },
    ];
  }

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      include: {
        visitor: { select: { id: true, firstName: true, lastName: true, company: true, isVIP: true } },
        host: { select: { name: true, email: true } },
      },
      orderBy: { checkIn: "desc" },
      skip,
      take: limit,
    }),
    prisma.visit.count({ where }),
  ]);

  return NextResponse.json({ visits, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    visitorId,
    hostId,
    hostName,
    purpose,
    purposeDetails,
    visitorType,
    expectedCheckOut,
    location,
    vehicleNumber,
    notes,
    ndaSigned,
    invitationId,
  } = body;

  if (!visitorId || !purpose) {
    return NextResponse.json({ error: "Visitor and purpose are required" }, { status: 400 });
  }

  // Check if visitor is already checked in
  const activeVisit = await prisma.visit.findFirst({
    where: { visitorId, status: "CHECKED_IN" },
  });
  if (activeVisit) {
    return NextResponse.json({ error: "Visitor is already checked in" }, { status: 409 });
  }

  const badgeNumber = generateBadgeNumber();
  const qrData = JSON.stringify({ visitorId, badgeNumber, ts: Date.now() });
  const qrCode = await createQRCode(qrData);

  const visit = await prisma.visit.create({
    data: {
      visitorId,
      hostId,
      hostName,
      purpose,
      purposeDetails,
      visitorType: visitorType || "GUEST",
      expectedCheckOut: expectedCheckOut ? new Date(expectedCheckOut) : undefined,
      location,
      vehicleNumber,
      notes,
      ndaSigned: ndaSigned ?? false,
      ndaSignedAt: ndaSigned ? new Date() : undefined,
      status: "CHECKED_IN",
      badgeNumber,
      qrCode,
      invitationId,
    },
    include: {
      visitor: true,
      host: { select: { name: true, email: true } },
    },
  });

  // Update invitation status if applicable
  if (invitationId) {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId: hostId,
      type: "CHECK_IN",
      title: "Visitor Checked In",
      message: `${visit.visitor.firstName} ${visit.visitor.lastName} has checked in to see you`,
      data: JSON.stringify({ visitId: visit.id }),
    },
  });

  // Send email to host
  if (visit.host?.email) {
    sendEmail({
      to: visit.host.email,
      subject: `Your visitor ${visit.visitor.firstName} ${visit.visitor.lastName} has arrived`,
      html: buildCheckInNotificationEmail({
        hostName: visit.host.name || "Host",
        visitorName: `${visit.visitor.firstName} ${visit.visitor.lastName}`,
        visitorCompany: visit.visitor.company || "N/A",
        checkInTime: format(new Date(), "MMMM d, yyyy 'at' h:mm a"),
        location: location || "Reception",
        badgeNumber,
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ visit }, { status: 201 });
}
