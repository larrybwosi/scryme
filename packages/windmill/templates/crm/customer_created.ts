// fallow-ignore-next-line unused-files
/**
 * Windmill PoC Script: Customer Created Handler
 *
 * This script runs in Windmill. It receives the Customer Created event
 * from Dealio and performs downstream logic (e.g., syncing to CRM).
 */

export async function main(
  data: {
    customerId: string;
    name: string;
    email?: string;
    organizationId: string;
    eventType: string;
  },
  env: {
    DEALIO_V3_API_URL: string;
    DEALIO_API_KEY: string;
  },
) {
  console.log(
    `Processing ${data.eventType} for customer ${data.customerId} in org ${data.organizationId}`,
  );

  // Example: Fetch full customer details via V3 API to enrich data
  const response = await fetch(
    `${env.DEALIO_V3_API_URL}/api/v3/${data.organizationId}/customers/${data.customerId}`,
    {
      headers: {
        Authorization: `Bearer ${env.DEALIO_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch customer ${data.customerId}: ${response.statusText}`,
    );
  }

  const customer = await response.json();
  console.log(`Successfully fetched details for ${customer.name}`);

  // Downstream logic: Admin Notifications
  try {
    const { notificationEngine } = await import("@repo/notifications");
    const { db } = await import("@repo/db");

    // Find all admins/members who have opted in for notifications via tags
    const membersToNotify = await db.member.findMany({
      where: {
        organizationId: data.organizationId,
        tags: { contains: "notify:customer_created" },
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        tags: true,
      },
    });

    for (const member of membersToNotify) {
      const tags = member.tags?.split(",").map((t) => t.trim()) || [];
      const channels = [];
      if (tags.includes("notify:customer_created:email"))
        channels.push("EMAIL");
      if (tags.includes("notify:customer_created:discord"))
        channels.push("DISCORD");
      if (tags.includes("notify:customer_created:webhook"))
        channels.push("WEBHOOK");

      if (channels.length > 0) {
        await notificationEngine.notify({
          organizationId: data.organizationId,
          templateName: "CUSTOMER_REGISTERED_ADMIN",
          data: {
            customerName: customer.name,
            customerEmail: customer.email,
            customerId: customer.id,
            registrationDate: new Date().toLocaleDateString(),
          },
          recipients: {
            memberIds: [member.id],
          },
          channels: channels as any,
        });
      }
    }
  } catch (e) {
    console.error(
      `Failed to send admin notifications: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return {
    success: true,
    processedAt: new Date().toISOString(),
    customerName: customer.name,
  };
}
