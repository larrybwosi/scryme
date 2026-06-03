import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { getServerAuth } from '@repo/auth/server';
import { WindmillTemplateService } from '@repo/windmill/server';

export async function POST() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  try {
    await WindmillTemplateService.provisionAndDeploy(
      org.id,
      org.name,
      org.slug
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
