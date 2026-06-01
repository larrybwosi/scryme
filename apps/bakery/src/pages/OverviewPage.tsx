import Overview from '@/components/bakery/Overview';

export default function OverviewPage() {
  return (
    <Overview
      setActiveTab={(tab) => {
        console.log('Switching to tab:', tab);
      }}
    />
  );
}
