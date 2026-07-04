import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { getServerAuth } from '@repo/auth/server';
import { WindmillTemplateService } from '@repo/windmill/server';
import { ScrymeChatApiClient } from '@repo/scryme';
import { PlaneApiClient } from '@repo/shared';

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

    // Provision Plane
    if (process.env.PLANE_ACCESS_TOKEN) {
      const planeClient = new PlaneApiClient();
      const workspaceSlug = `org-${org.slug}`.toLowerCase();

      try {
        const planeWorkspace = await planeClient.createWorkspace(
          org.name,
          workspaceSlug,
        );

        await db.planeConfiguration.upsert({
          where: { organizationId: org.id },
          update: {
            workspaceId: planeWorkspace.id,
            workspaceSlug: planeWorkspace.slug,
            isActive: true,
          },
          create: {
            organizationId: org.id,
            workspaceId: planeWorkspace.id,
            workspaceSlug: planeWorkspace.slug,
            isActive: true,
          },
        });
      } catch (planeError: any) {
        console.error('Failed to provision Plane workspace:', planeError.message);
        // We don't fail the whole request if Plane fails, but we log it
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
