import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { getServerAuth } from '@repo/auth/server';
import { WindmillTemplateService } from '@repo/windmill/server';
import { createMemberToken } from '@repo/shared/server';
import axios from 'axios';

export async function POST() {
  const auth = await getServerAuth();
  if (!auth?.organizationId || !auth?.memberId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  try {
    // Provision Windmill
    await WindmillTemplateService.provisionAndDeploy(
      org.id,
      org.name,
      org.slug
    );

    // Call API to provision Scryme independently
    // We use a temporary member token to authenticate the request to the API
    const token = await createMemberToken(auth.memberId, auth.organizationId, 'system');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api:3000';

    try {
      await axios.post(`${apiUrl.replace(/\/$/, '')}/v2/scryme/provision`, {}, {
        headers: {
          'x-member-token': token,
        }
      });
    } catch (scrymeError: any) {
      console.error('Failed to provision Scryme via API:', scrymeError.response?.data || scrymeError.message);
      // We don't fail the whole process if Scryme fails, but we log it
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
