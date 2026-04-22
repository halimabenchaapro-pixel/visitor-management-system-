import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
          { idNumber: { contains: search } },
        ],
      }
    : {};

  const [entries, total] = await Promise.all([
    prisma.watchlist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.watchlist.count({ where }),
  ]);

  return NextResponse.json({ entries, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, email, phone, idNumber, company, reason, notes } = body;

  if (!firstName || !lastName || !reason) {
    return NextResponse.json({ error: "Name and reason are required" }, { status: 400 });
  }

  const entry = await prisma.watchlist.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      company,
      reason,
      notes,
      addedBy: session.user.name || session.user.email || "Unknown",
    },
  });

  // Also flag matching visitors
  if (email || idNumber) {
    await prisma.visitor.updateMany({
      where: {
        OR: [
          email ? { email } : {},
          idNumber ? { idNumber } : {},
        ],
      },
      data: { isBlacklisted: true, blacklistReason: reason },
    });
  }

  return NextResponse.json({ entry }, { status: 201 });
}
