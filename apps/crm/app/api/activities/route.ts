import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { auth } from "@repo/auth/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security check: Verify user is a member of the requested organization
  const member = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId: organizationId,
    },
  });

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const activities = await db.crmActivity.findMany({
      where: { organizationId },
      include: {
        member: {
            include: {
                user: true
            }
        },
        record: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json([], { status: 500 });
  }
}
