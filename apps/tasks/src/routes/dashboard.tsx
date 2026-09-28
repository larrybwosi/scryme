import { createFileRoute } from '@tanstack/react-router';
import Layout from '../components/Layout';
import DashboardPage from '../pages/DashboardPage';

export const Route = createFileRoute('/dashboard')({
  component: DashboardRouteComponent,
});

function DashboardRouteComponent() {
  return (
    <Layout>
      <DashboardPage />
    </Layout>
  );
}
