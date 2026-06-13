'use server';

import { getServerAuth } from '@repo/auth/server';
import { createMemberToken } from '@repo/shared/server';

const getWorkflowsSDK = async () => {
  const { getSDK } = await import('@repo/sdk');
  const { env } = await import('@repo/env');

  const auth = await getServerAuth();

  const sdk = getSDK({
    baseURL: `${env.NEXT_PUBLIC_API_URL}/api/v2`,
  });

  if (auth?.memberId && auth?.organizationId) {
    // Generate a member token for the API request since the web app uses session-based auth
    // but the V2 API expects a JWT member token
    const token = await createMemberToken(auth.memberId, auth.organizationId, 'web-session');
    sdk.setMemberToken(token);
  }

  return sdk;
};

export async function getAvailableWorkflowsAction() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return { success: false, error: 'Unauthorized' };

  try {
    const sdk = await getWorkflowsSDK();
    const workflows = await sdk.workflows.getAvailable();
    return { success: true, data: workflows };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Failed to fetch workflows' };
  }
}

export async function provisionWorkflowAction(path: string, settings: any) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return { success: false, error: 'Unauthorized' };

  try {
    const sdk = await getWorkflowsSDK();
    const result = await sdk.workflows.provision({ path, settings });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Failed to provision workflow' };
  }
}

export async function triggerWorkflowAction(path: string, inputs: any) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return { success: false, error: 'Unauthorized' };

  try {
    const sdk = await getWorkflowsSDK();
    const execution = await sdk.workflows.trigger({ path, inputs });
    return { success: true, data: execution };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Failed to trigger workflow' };
  }
}

export async function getWorkflowHistoryAction(path?: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return { success: false, error: 'Unauthorized' };

  try {
    const sdk = await getWorkflowsSDK();
    const history = await sdk.workflows.getHistory({ path });
    return { success: true, data: history };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Failed to fetch history' };
  }
}
