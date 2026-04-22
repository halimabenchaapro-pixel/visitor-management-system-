import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDay, subDays, startOfMonth, endOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const last30Start = subDays(today, 30);
  const monthStart = startOfMonth(new Date());

  const [
    totalVisitors,
    currentlyIn,
    todayVisits,
    pendingInvitations,
    weeklyVisits,
    purposeBreakdown,
    recentVisits,
    monthlyVisits,
  ] = await Promise.all([
    prisma.visitor.count(),
    prisma.visit.count({ where: { status: "CHECKED_IN" } }),
    prisma.visit.count({ where: { checkIn: { gte: today, lte: todayEnd } } }),
    prisma.invitation.count({ where: { status: "PENDING" } }),

    // Last 7 days visits
    prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT date(checkIn) as date, count(*) as count
      FROM Visit
      WHERE checkIn >= ${subDays(today, 6).toISOString()}
      GROUP BY date(checkIn)
      ORDER BY date ASC
    `,

    // Visit purpose breakdown
    prisma.visit.groupBy({
      by: ["purpose"],
      _count: { id: true },
      where: { checkIn: { gte: last30Start } },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),

    // Recent check-ins
    prisma.visit.findMany({
      where: { status: "CHECKED_IN" },
      include: {
        visitor: { select: { firstName: true, lastName: true, company: true, photo: true } },
      },
      orderBy: { checkIn: "desc" },
      take: 8,
    }),

    // Monthly visits (last 6 months)
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT strftime('%Y-%m', checkIn) as month, count(*) as count
      FROM Visit
      WHERE checkIn >= ${subDays(today, 180).toISOString()}
      GROUP BY strftime('%Y-%m', checkIn)
      ORDER BY month ASC
    `,
  ]);

  return NextResponse.json({
    stats: { totalVisitors, currentlyIn, todayVisits, pendingInvitations },
    weeklyVisits: weeklyVisits.map((r) => ({ date: r.date, count: Number(r.count) })),
    monthlyVisits: monthlyVisits.map((r) => ({ month: r.month, count: Number(r.count) })),
    purposeBreakdown: purposeBreakdown.map((p) => ({
      purpose: p.purpose,
      count: p._count.id,
    })),
    recentVisits,
  });
}
