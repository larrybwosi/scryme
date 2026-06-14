import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { getServerAuth } from '@repo/auth/server';
import { WindmillTemplateService } from '@repo/windmill/server';
import { ScrymeChatApiClient } from '@repo/scryme';

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
    // Provision Windmill
    await WindmillTemplateService.provisionAndDeploy(
      org.id,
      org.name,
      org.slug
    );

    // Provision Scryme independently
    if (process.env.SCRYME_CHAT_CLIENT_ID && process.env.SCRYME_CHAT_CLIENT_SECRET) {
      const scrymeClient = new ScrymeChatApiClient();
      const workspaceSlug = `org-${org.slug}`.toLowerCase();

      const scrymeWorkspace = await scrymeClient.createWorkspace(
        org.name,
        workspaceSlug,
      );

      await db.scrymeConfiguration.upsert({
        where: { organizationId: org.id },
        update: {
          workspaceId: scrymeWorkspace.id,
          workspaceSlug: scrymeWorkspace.slug,
          isActive: true,
        },
        create: {
          organizationId: org.id,
          workspaceId: scrymeWorkspace.id,
          workspaceSlug: scrymeWorkspace.slug,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
