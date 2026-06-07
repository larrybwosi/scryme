import { NextRequest, NextResponse } from 'next/server';
import { trackCampaignEvent } from '../../../../actions/campaigns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('cid');
  const recordId = searchParams.get('rid');
  const type = searchParams.get('type') || 'OPENED';

  if (!campaignId) {
    return new NextResponse('Missing campaign ID', { status: 400 });
  }

  await trackCampaignEvent(campaignId, type, recordId || undefined);

  // Return a transparent 1x1 pixel for email tracking
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
