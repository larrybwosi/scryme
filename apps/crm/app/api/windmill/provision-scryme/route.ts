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

    // Provision Scryme independently using V3 API
    if (process.env.SCRYME_CHAT_CLIENT_ID && process.env.SCRYME_CHAT_CLIENT_SECRET) {
      const scrymeClient = new ScrymeChatApiClient();
      const workspaceSlug = `org-${org.slug}`.toLowerCase();
      const ownerEmail = auth.user?.email || 'admin@scryme.tech';

      const scrymeWorkspace = await scrymeClient.createWorkspace(
        org.name,
        workspaceSlug,
        ownerEmail,
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

      // Register the workspace webhook for interactive action webhook processing
      const publicUrl = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
      if (publicUrl) {
        const webhookUrl = `${publicUrl.replace(/\/$/, '')}/v2/scryme/webhook`;
        try {
          await scrymeClient.registerWorkspaceWebhook(scrymeWorkspace.slug, webhookUrl);
        } catch (webhookErr: any) {
          console.error('Failed to register workspace webhook in CRM route:', webhookErr.message);
        }
      }
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
