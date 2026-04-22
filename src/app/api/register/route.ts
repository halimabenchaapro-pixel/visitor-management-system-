import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateBadgeNumber } from "@/lib/utils";
import { createQRCode } from "@/lib/qrcode";
import { sendEmail, buildCheckInNotificationEmail } from "@/lib/email";
import { format } from "date-fns";

export async function GET() {
  // Return list of hosts for the form dropdown (public, names only)
  const hosts = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ hosts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    nationality,
    idType,
    idNumber,
    hostId,
    hostName,
    purpose,
    vehicleNumber,
    ndaSigned,
  } = body;

  if (!firstName || !lastName || !purpose) {
    return NextResponse.json(
      { error: "First name, last name, and purpose are required" },
      { status: 400 }
    );
  }

  // Check watchlist
  const watchlistMatch = await prisma.watchlist.findFirst({
    where: {
      isActive: true,
      OR: [
        email ? { email: { equals: email } } : {},
        idNumber ? { idNumber: { equals: idNumber } } : {},
        { firstName: { equals: firstName }, lastName: { equals: lastName } },
      ],
    },
  });

  // Find or create visitor
  let visitor = email
    ? await prisma.visitor.findFirst({ where: { email } })
    : null;

  if (!visitor) {
    visitor = await prisma.visitor.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        nationality,
        idType,
        idNumber,
        isBlacklisted: !!watchlistMatch,
        blacklistReason: watchlistMatch?.reason,
      },
    });
  }

  // Check if already checked in
  const activeVisit = await prisma.visit.findFirst({
    where: { visitorId: visitor.id, status: "CHECKED_IN" },
  });
  if (activeVisit) {
    return NextResponse.json(
      { error: "You are already checked in" },
      { status: 409 }
    );
  }

  const resolvedHost = hostId
    ? await prisma.user.findUnique({ where: { id: hostId }, select: { id: true, name: true, email: true } })
    : null;

  const badgeNumber = generateBadgeNumber();
  const qrData = JSON.stringify({ visitorId: visitor.id, badgeNumber, ts: Date.now() });
  const qrCode = await createQRCode(qrData);

  const visit = await prisma.visit.create({
    data: {
      visitorId: visitor.id,
      hostId: resolvedHost?.id,
      hostName: resolvedHost?.name || hostName || null,
      purpose,
      visitorType: "GUEST",
      status: "CHECKED_IN",
      badgeNumber,
      qrCode,
      vehicleNumber,
      ndaSigned: ndaSigned ?? false,
      ndaSignedAt: ndaSigned ? new Date() : undefined,
    },
  });

  // Notify host by email
  if (resolvedHost?.email) {
    sendEmail({
      to: resolvedHost.email,
      subject: `Your visitor ${firstName} ${lastName} has arrived`,
      html: buildCheckInNotificationEmail({
        hostName: resolvedHost.name || "Host",
        visitorName: `${firstName} ${lastName}`,
        visitorCompany: company || "N/A",
        checkInTime: format(new Date(), "MMMM d, yyyy 'at' h:mm a"),
        location: "Reception (Self Check-in)",
        badgeNumber,
      }),
    }).catch(console.error);
  }

  // In-app notification
  await prisma.notification.create({
    data: {
      userId: resolvedHost?.id,
      type: "SELF_CHECKIN",
      title: "Visitor Self-Registered",
      message: `${firstName} ${lastName} checked in via QR code`,
      data: JSON.stringify({ visitId: visit.id }),
    },
  });

  return NextResponse.json({
    success: true,
    watchlistAlert: !!watchlistMatch,
    visit: {
      id: visit.id,
      badgeNumber,
      qrCode,
      checkIn: visit.checkIn,
    },
    visitor: { firstName, lastName, company },
  });
}
