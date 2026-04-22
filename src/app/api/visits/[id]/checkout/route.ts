import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function POST(_req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const visit = await prisma.visit.findUnique({ where: { id } });
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (visit.status !== "CHECKED_IN") {
    return NextResponse.json({ error: "Visitor is not currently checked in" }, { status: 400 });
  }

  const updated = await prisma.visit.update({
    where: { id },
    data: { status: "CHECKED_OUT", checkOut: new Date() },
    include: {
      visitor: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ visit: updated });
}
