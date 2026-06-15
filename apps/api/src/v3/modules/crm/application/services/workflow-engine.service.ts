import {db} from "@repo/db";

export class WorkflowExecutionEngine {
  /**
   * Start a workflow for a specific record (Customer/BusinessAccount)
   */
  async startWorkflow(workflowId: string, recordId: string) {
    const workflow = await db.campaignWorkflow.findUnique({
      where: {id: workflowId},
    });

    if (!workflow || !workflow.isActive) return;

    // Find trigger node
    const nodes = workflow.nodes as any[];
    const triggerNode = nodes.find(n => n.type === "trigger");

    if (!triggerNode) return;

    // Create instance
    const instance = await db.campaignWorkflowInstance.create({
      data: {
        workflowId,
        recordId,
        status: "RUNNING",
        currentNodeId: triggerNode.id,
      },
    });

    // Execute next steps
    await this.executeNextNodes(instance.id);
  }

  /**
   * Process the next nodes in a workflow instance
   */
  async executeNextNodes(instanceId: string) {
    const instance = await db.campaignWorkflowInstance.findUnique({
      where: {id: instanceId},
      include: {workflow: true},
    });

    if (!instance || instance.status !== "RUNNING") return;

    const edges = instance.workflow.edges as any[];
    const nodes = instance.workflow.nodes as any[];

    // Find outgoing edges from current node
    const nextEdges = edges.filter(e => e.source === instance.currentNodeId);

    if (nextEdges.length === 0) {
      await db.campaignWorkflowInstance.update({
        where: {id: instanceId},
        data: {status: "COMPLETED"},
      });
      return;
    }

    for (const edge of nextEdges) {
      const nextNode = nodes.find(n => n.id === edge.target);
      if (!nextNode) continue;

      await this.executeNode(instanceId, nextNode);
    }
  }

  /**
   * Execute a specific node
   */
  private async executeNode(instanceId: string, node: any) {
    console.log(
      `Executing node ${node.id} (${node.type}) for instance ${instanceId}`,
    );

    // Update current node
    await db.campaignWorkflowInstance.update({
      where: {id: instanceId},
      data: {currentNodeId: node.id},
    });

    if (node.type === "action") {
      const {type, label} = node.data;

      // Simulate action execution
      console.log(`[ACTION] Executing ${type}: ${label}`);

      // If it's a task, we could create a CrmFollowUp here
      if (type === "TASK") {
        const instance = await db.campaignWorkflowInstance.findUnique({
          where: {id: instanceId},
          include: {workflow: {include: {organization: true}}},
        });

        if (instance) {
          await db.crmFollowUp.create({
            data: {
              organizationId: instance.workflow.organizationId,
              recordId: instance.recordId,
              title: label,
              description: `Automated task from workflow: ${instance.workflow.name}`,
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 1 day
              status: "PENDING",
              priority: "MEDIUM",
            },
          });
        }
      }

      // Proceed to next nodes
      await this.executeNextNodes(instanceId);
    } else if (node.type === "delay") {
      const duration = node.data.duration || "1 Hour";
      console.log(`[DELAY] Scheduling resume for ${instanceId} in ${duration}`);

      let delayMs = 3600000; // Default 1 hour
      if (duration.includes("Day")) delayMs = 86400000;
      if (duration.includes("Week")) delayMs = 604800000;

      await db.campaignWorkflowInstance.update({
        where: {id: instanceId},
        data: {status: "HALTED"},
      });

      const {workflowQueue} =
        await import("../../infrastructure/queues/workflow.queue");
      await workflowQueue.add(
        "resume-workflow",
        {instanceId},
        {delay: delayMs},
      );
    }
  }
}
