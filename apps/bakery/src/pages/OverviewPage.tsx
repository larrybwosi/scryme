import { useEffect } from 'react';
import Overview from '@/components/bakery/Overview';
import sdk from '@/lib/sdk';
import { toast } from 'sonner';

export default function OverviewPage() {
  useEffect(() => {
    // Verify provisioning by fetching current device/member info from /devices/me
    sdk.bakery.getMe()
      .then((device: any) => {
        console.log('Device provisioned successfully:', device);
      })
      .catch((error: any) => {
        console.error('Failed to verify provisioning:', error);
        if (error?.response?.status && error.response.status !== 401) {
          toast.error('Device provisioning verification failed. Please check your setup.');
        }
      });
  }, []);

  return (
    <Overview
      setActiveTab={(tab) => {
        console.log('Switching to tab:', tab);
      }}
    />
  );
}
