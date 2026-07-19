'use server';

import { db } from '@repo/db';
import {
  campaignSchema,
  campaignSegmentSchema,
  campaignWorkflowSchema,
  type CampaignFormValues,
  type CampaignSegmentFormValues,
  type CampaignWorkflowFormValues
} from '../../lib/validations';
import { revalidatePath } from 'next/cache';

// --- Campaign Actions ---

export async function createCampaign(data: CampaignFormValues, organizationId: string, memberId: string): Promise<any> {
  try {
    const validatedData = campaignSchema.parse(data);

    const campaign = await db.campaign.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: memberId,
      },
    });

    revalidatePath('/campaigns');
    return { success: true, data: campaign };
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return { success: false, error: error.message || 'Failed to create campaign' };
  }
}

export async function updateCampaign(id: string, data: Partial<CampaignFormValues>): Promise<any> {
  try {
    const campaign = await db.campaign.update({
      where: { id },
      data,
    });

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${id}`);
    return { success: true, data: campaign };
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return { success: false, error: error.message || 'Failed to update campaign' };
  }
}

export async function getCampaigns(organizationId: string): Promise<any[]> {
  try {
    return await db.campaign.findMany({
      where: { organizationId },
      include: {
        segment: true,
        workflow: true,
        createdBy: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to fetch campaigns');
  }
}

export async function getCampaign(id: string): Promise<any> {
  try {
    return await db.campaign.findUnique({
      where: { id },
      include: {
        segment: true,
        workflow: true,
        createdBy: { include: { user: true } },
        approvedBy: { include: { user: true } },
        events: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            record: true,
            transaction: true,
          }
        }
      },
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw new Error('Failed to fetch campaign');
  }
}

// --- Segment Actions ---

export async function createSegment(data: CampaignSegmentFormValues, organizationId: string): Promise<any> {
  try {
    const validatedData = campaignSegmentSchema.parse(data);
    const segment = await db.campaignSegment.create({
      data: {
        ...validatedData,
        organizationId,
      },
    });
    revalidatePath('/campaigns/segments');
    return { success: true, data: segment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteWorkflow(id: string): Promise<any> {
  try {
    await db.campaignWorkflow.delete({
      where: { id },
    });
    revalidatePath('/campaigns/workflows');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return { success: false, error: error.message || 'Failed to delete workflow' };
  }
}

export async function duplicateWorkflow(id: string): Promise<any> {
  try {
    const original = await db.campaignWorkflow.findUnique({
      where: { id },
    });

    if (!original) {
      return { success: false, error: 'Original workflow not found' };
    }

    const duplicated = await db.campaignWorkflow.create({
      data: {
        name: `${original.name} (Copy)`,
        organizationId: original.organizationId,
        nodes: original.nodes || [],
        edges: original.edges || [],
        isActive: false,
      },
    });

    revalidatePath('/campaigns/workflows');
    return { success: true, data: duplicated };
  } catch (error: any) {
    console.error('Error duplicating workflow:', error);
    return { success: false, error: error.message || 'Failed to duplicate workflow' };
  }
}

export async function getSegments(organizationId: string): Promise<any[]> {
  return await db.campaignSegment.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}

// --- Workflow Actions ---

export async function createWorkflow(data: CampaignWorkflowFormValues, organizationId: string): Promise<any> {
  try {
    const validatedData = campaignWorkflowSchema.parse(data);
    const workflow = await db.campaignWorkflow.create({
      data: {
        ...validatedData,
        organizationId,
      },
    });
    revalidatePath('/campaigns/workflows');
    return { success: true, data: workflow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateWorkflow(id: string, data: Partial<CampaignWorkflowFormValues>): Promise<any> {
  try {
    const workflow = await db.campaignWorkflow.update({
      where: { id },
      data,
    });
    revalidatePath('/campaigns/workflows');
    revalidatePath(`/campaigns/workflows/${id}`);
    return { success: true, data: workflow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWorkflows(organizationId: string): Promise<any[]> {
  return await db.campaignWorkflow.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

// --- Analytics & Events ---

export async function trackCampaignEvent(campaignId: string, type: string, recordId?: string, metadata?: any, transactionId?: string) {
  try {
    const event = await db.campaignEvent.create({
      data: {
        campaignId,
        type,
        recordId,
        metadata,
        transactionId,
      }
    });

    // Update campaign summary stats
    const updateData: any = {};
    if (type === 'SENT') updateData.totalSent = { increment: 1 };
    if (type === 'OPENED') updateData.totalOpened = { increment: 1 };
    if (type === 'CLICKED') updateData.totalClicked = { increment: 1 };
    if (type === 'CONVERTED') updateData.totalConverted = { increment: 1 };

    if (transactionId) {
      const transaction = await db.transaction.findUnique({ where: { id: transactionId } });
      if (transaction) {
        updateData.totalRevenue = { increment: transaction.finalTotal };
      }
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    return { success: true, data: event };
  } catch (error: any) {
    console.error('Error tracking campaign event:', error);
    return { success: false, error: error.message };
  }
}
