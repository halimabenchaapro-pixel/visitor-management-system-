import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { host: { select: { name: true, email: true } } },
  });

  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invitation });
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const invitation = await prisma.invitation.update({
    where: { id },
    data: { status, respondedAt: new Date() },
  });

  return NextResponse.json({ invitation });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.invitation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
