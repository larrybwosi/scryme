import { useEffect } from 'react';
import Overview from '@/components/bakery/Overview';
import sdk from '@/lib/sdk';
import { toast } from 'sonner';

export default function OverviewPage() {
  useEffect(() => {
    // Verify provisioning by fetching current device info
    sdk.bakery.getMe()
      .then((device) => {
        console.log('Device provisioned successfully:', device);
      })
      .catch((error) => {
        console.error('Failed to verify provisioning:', error);
        toast.error('Device provisioning verification failed. Please check your setup.');
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
