// fallow-ignore-next-line unused-files
/**
 * Windmill Script: Admin Notification Opt-in
 *
 * This script allows an admin to opt-in (or out) of receiving
 * notifications when a new customer registers.
 */

import { db } from '@repo/db';

export async function main(
  data: {
    memberId: string;
    organizationId: string;
    optIn: boolean;
    channel: 'EMAIL' | 'DISCORD' | 'WEBHOOK';
  }
) {
  const { memberId, organizationId, optIn, channel } = data;

  console.log(`Setting notification preference for member ${memberId} in org ${organizationId}: ${optIn} for channel ${channel}`);

  const member = await db.member.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== organizationId) {
    throw new Error('Member not found or does not belong to the organization');
  }

  // Update member tags with notification preferences
  const currentTags = member.tags ? member.tags.split(',').map(t => t.trim()) : [];
  const tagToManage = `notify:customer_created:${channel.toLowerCase()}`;

  let newTags: string[];
  if (optIn) {
    if (!currentTags.includes(tagToManage)) {
      newTags = [...currentTags, tagToManage];
    } else {
      newTags = currentTags;
    }
  } else {
    newTags = currentTags.filter(t => t !== tagToManage);
  }

  await db.member.update({
    where: { id: memberId },
    data: {
      tags: newTags.join(','),
    }
  });

  return {
    success: true,
    memberId,
    optIn,
    channel,
    message: `Successfully ${optIn ? 'opted-in to' : 'opted-out of'} customer registration notifications via ${channel}.`
  };
}
