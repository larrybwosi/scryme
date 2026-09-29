import { createFileRoute, useLocation } from '@tanstack/react-router';
import Layout from '../components/Layout';
import ProjectsPage from '../pages/ProjectsPage';
import ClientsPage from '../pages/ClientsPage';
import TeamsPage from '../pages/TeamsPage';
import ActivityPage from '../pages/ActivityPage';
import TagsPage from '../pages/TagsPage';
import TimeOffPage from '../pages/TimeOffPage';
import InvoicesPage from '../pages/InvoicesPage';
import ExpensesPage from '../pages/ExpensesPage';
import GenericModulePage from '../pages/GenericModulePage';

export const Route = createFileRoute('/$')({
  component: SplatRouteComponent,
});

function SplatRouteComponent() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const renderContent = () => {
    if (path.startsWith('/projects')) return <ProjectsPage />;
    if (path.startsWith('/clients')) return <ClientsPage />;
    if (path.startsWith('/teams')) return <TeamsPage />;
    if (path.startsWith('/activity')) return <ActivityPage />;
    if (path.startsWith('/tags')) return <TagsPage />;
    if (path.startsWith('/time-off')) return <TimeOffPage />;
    if (path.startsWith('/invoices')) return <InvoicesPage />;
    if (path.startsWith('/expenses')) return <ExpensesPage />;
    return <GenericModulePage />;
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}
