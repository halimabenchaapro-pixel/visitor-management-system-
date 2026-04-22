import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const visitor = await prisma.visitor.findUnique({
    where: { id },
    include: {
      visits: {
        orderBy: { checkIn: "desc" },
        include: { host: { select: { name: true } } },
      },
      invitations: {
        orderBy: { scheduledDate: "desc" },
        take: 5,
      },
    },
  });

  if (!visitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ visitor });
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { firstName, lastName, email, phone, company, idType, idNumber, nationality, notes, isVIP, isBlacklisted, blacklistReason } = body;

  const visitor = await prisma.visitor.update({
    where: { id },
    data: { firstName, lastName, email, phone, company, idType, idNumber, nationality, notes, isVIP, isBlacklisted, blacklistReason },
  });

  return NextResponse.json({ visitor });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.visitor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
