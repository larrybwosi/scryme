export interface IWorkflowQueue {
  add(name: string, data: any, options?: any): Promise<any>;
}

export const IWorkflowQueue = Symbol("IWorkflowQueue");
