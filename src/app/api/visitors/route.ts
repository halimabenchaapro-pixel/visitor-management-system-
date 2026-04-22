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
  const isVIP = searchParams.get("vip") === "true" ? true : undefined;
  const isBlacklisted = searchParams.get("blacklisted") === "true" ? true : undefined;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { company: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {},
      isVIP !== undefined ? { isVIP } : {},
      isBlacklisted !== undefined ? { isBlacklisted } : {},
    ],
  };

  const [visitors, total] = await Promise.all([
    prisma.visitor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { visits: true } },
        visits: {
          take: 1,
          orderBy: { checkIn: "desc" },
          select: { checkIn: true, status: true },
        },
      },
    }),
    prisma.visitor.count({ where }),
  ]);

  return NextResponse.json({ visitors, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, email, phone, company, idType, idNumber, nationality, notes, isVIP } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
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

  const visitor = await prisma.visitor.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      company,
      idType,
      idNumber,
      nationality,
      notes,
      isVIP: isVIP ?? false,
      isBlacklisted: !!watchlistMatch,
      blacklistReason: watchlistMatch?.reason,
    },
  });

  return NextResponse.json({ visitor, watchlistAlert: !!watchlistMatch }, { status: 201 });
}
