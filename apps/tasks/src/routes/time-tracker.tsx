import { createFileRoute } from '@tanstack/react-router';
import Layout from '../components/Layout';
import TimeTrackerPage from '../pages/TimeTrackerPage';

export const Route = createFileRoute('/time-tracker')({
  component: TimeTrackerRouteComponent,
});

function TimeTrackerRouteComponent() {
  return (
    <Layout>
      <TimeTrackerPage />
    </Layout>
  );
}
