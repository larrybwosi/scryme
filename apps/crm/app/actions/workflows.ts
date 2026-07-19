'use server';

import { db } from '@repo/db';

export async function getWorkflow(id: string) {
  return await db.campaignWorkflow.findUnique({
    where: { id },
    include: {
      organization: true,
    }
  });
}

export async function simulateWorkflow(workflowId: string, customerId: string) {
  try {
    const workflow = await db.campaignWorkflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) {
      return { success: false, error: "Workflow not found" };
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    const nodes = (workflow.nodes as any[]) || [];
    const edges = (workflow.edges as any[]) || [];

    // 1. Resolve starting/trigger node
    const triggerNode = nodes.find((n) => n.type === 'trigger');
    if (!triggerNode) {
      return { success: false, error: "Workflow has no trigger node to start from" };
    }

    const logs: any[] = [];
    logs.push({
      nodeId: triggerNode.id,
      type: 'trigger',
      label: triggerNode.data?.label || 'Trigger',
      status: 'SUCCESS',
      details: `Workflow triggered on event: ${triggerNode.data?.description || 'Custom Trigger'}.`,
    });

    // 2. Sequentially traverse nodes based on edges
    let currentNodeId = triggerNode.id;
    let visited = new Set<string>([currentNodeId]);

    while (currentNodeId) {
      const outgoingEdges = edges.filter((e) => e.source === currentNodeId);
      if (outgoingEdges.length === 0) break;

      const edge = outgoingEdges.find((e) => !visited.has(e.target)) || outgoingEdges[0];
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode || visited.has(targetNode.id)) break;

      visited.add(targetNode.id);
      currentNodeId = targetNode.id;

      const nodeType = targetNode.type;
      const subType = targetNode.data?.subType || '';
      const label = targetNode.data?.label || '';
      let details = '';
      let content = targetNode.data?.content || '';

      if (content) {
        content = content
          .replace(/\{customer\.name\}/g, customer.name)
          .replace(/\{customer\.email\}/g, customer.email || 'N/A')
          .replace(/\{customer\.phone\}/g, customer.phone || 'N/A')
          .replace(/\{customer\.company\}/g, customer.company || 'Private');
      }

      if (nodeType === 'action') {
        if (subType === 'SCRYMECHAT') {
          details = `Sending native ScrymeChat message to target channel "${targetNode.data?.channelId || 'general'}":\n"${content || '(Empty message)'}"`;
        } else if (subType === 'EMAIL') {
          details = `Sending email to ${customer.email || 'N/A'}:\n"${content || '(Empty email)'}"`;
        } else if (subType === 'SMS') {
          details = `Sending SMS to ${customer.phone || 'N/A'}:\n"${content || '(Empty SMS)'}"`;
        } else if (subType === 'TASK') {
          details = `Creating follow-up task: "${label}"`;
        } else if (subType === 'TAG') {
          details = `Adding tag "${targetNode.data?.tagName || 'auto-tagged'}" to customer record.`;
        } else {
          details = `Action completed: ${label}`;
        }
      } else if (nodeType === 'delay') {
        details = `Delay sequence: Waiting for ${targetNode.data?.duration || '1 Day'} before proceeding.`;
      } else if (nodeType === 'condition') {
        const logic = targetNode.data?.condition || 'true';
        details = `Evaluating branch condition "${logic}": Result resolved to YES.`;
      } else {
        details = `Processing node: ${label}`;
      }

      logs.push({
        nodeId: targetNode.id,
        type: nodeType,
        subType,
        label,
        status: 'SUCCESS',
        details,
      });
    }

    // 3. Create simulated CampaignWorkflowInstance in database to log it
    let recordId = customer.crmRecordId;
    if (!recordId) {
      const defaultObjDef = await db.crmObjectDefinition.findFirst({
        where: { organizationId: customer.organizationId, name: 'contact' }
      });
      if (defaultObjDef) {
        const crmRecord = await db.crmRecord.create({
          data: {
            objectId: defaultObjDef.id,
            organizationId: customer.organizationId,
            data: { name: customer.name },
          }
        });
        await db.customer.update({
          where: { id: customer.id },
          data: { crmRecordId: crmRecord.id }
        });
        recordId = crmRecord.id;
      }
    }

    if (recordId) {
      await db.campaignWorkflowInstance.create({
        data: {
          workflowId: workflow.id,
          recordId: recordId,
          status: 'COMPLETED',
          currentNodeId: currentNodeId || triggerNode.id,
          context: { simulated: true, stepCount: logs.length }
        }
      });
    }

    return { success: true, logs };
  } catch (error: any) {
    console.error("Simulation error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during workflow simulation" };
  }
}
