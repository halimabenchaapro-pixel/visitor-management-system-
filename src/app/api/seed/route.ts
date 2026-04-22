import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email: "admin@company.com" } });
  if (existing) {
    return NextResponse.json({ message: "Already seeded" });
  }

  const adminPassword = await bcrypt.hash("admin123", 12);
  const receptionistPassword = await bcrypt.hash("reception123", 12);

  const [admin, receptionist] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@company.com",
        password: adminPassword,
        role: "ADMIN",
        department: "Management",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Receptionist",
        email: "reception@company.com",
        password: receptionistPassword,
        role: "RECEPTIONIST",
        department: "Front Desk",
      },
    }),
  ]);

  // Create sample visitors
  const visitors = await Promise.all([
    prisma.visitor.create({
      data: {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0101",
        company: "Acme Corp",
        nationality: "American",
        idType: "PASSPORT",
        idNumber: "A1234567",
      },
    }),
    prisma.visitor.create({
      data: {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@techcorp.com",
        phone: "+1-555-0102",
        company: "TechCorp",
        isVIP: true,
      },
    }),
    prisma.visitor.create({
      data: {
        firstName: "Mohamed",
        lastName: "Al-Ahmad",
        email: "m.ahmad@partner.ae",
        company: "Partner UAE",
        nationality: "UAE",
      },
    }),
  ]);

  // Create sample visits
  await Promise.all([
    prisma.visit.create({
      data: {
        visitorId: visitors[0].id,
        hostId: admin.id,
        hostName: admin.name,
        purpose: "Meeting",
        purposeDetails: "Q4 budget review",
        status: "CHECKED_IN",
        location: "Floor 3, Meeting Room A",
        badgeNumber: "VMS-20260421-1001",
        qrCode: "",
      },
    }),
    prisma.visit.create({
      data: {
        visitorId: visitors[1].id,
        hostId: admin.id,
        hostName: admin.name,
        purpose: "Interview",
        status: "CHECKED_OUT",
        checkOut: new Date(Date.now() - 2 * 60 * 60 * 1000),
        badgeNumber: "VMS-20260421-1002",
        qrCode: "",
      },
    }),
    prisma.visit.create({
      data: {
        visitorId: visitors[2].id,
        hostId: receptionist.id,
        hostName: receptionist.name,
        purpose: "Vendor",
        purposeDetails: "Annual contract renewal",
        status: "CHECKED_IN",
        location: "Floor 2, Conference Room B",
        badgeNumber: "VMS-20260421-1003",
        qrCode: "",
      },
    }),
  ]);

  // Sample invitation
  await prisma.invitation.create({
    data: {
      hostId: admin.id,
      visitorFirstName: "Emma",
      visitorLastName: "Wilson",
      visitorEmail: "emma@globalinc.com",
      visitorCompany: "Global Inc",
      purpose: "Meeting",
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      message: "Looking forward to meeting you!",
    },
  });

  // Default settings
  await Promise.all([
    prisma.setting.upsert({ where: { key: "company_name" }, update: {}, create: { key: "company_name", value: "My Company" } }),
    prisma.setting.upsert({ where: { key: "nda_required" }, update: {}, create: { key: "nda_required", value: "false" } }),
    prisma.setting.upsert({ where: { key: "badge_expiry_hours" }, update: {}, create: { key: "badge_expiry_hours", value: "24" } }),
    prisma.setting.upsert({ where: { key: "notify_host_on_checkin" }, update: {}, create: { key: "notify_host_on_checkin", value: "true" } }),
  ]);

  return NextResponse.json({
    message: "Seeded successfully",
    credentials: {
      admin: { email: "admin@company.com", password: "admin123" },
      receptionist: { email: "reception@company.com", password: "reception123" },
    },
  });
}
