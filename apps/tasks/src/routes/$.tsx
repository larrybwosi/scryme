import { createFileRoute, useLocation } from '@tanstack/react-router';
import Layout from '../components/Layout';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import ClientsPage from '../pages/ClientsPage';
import TeamsPage from '../pages/TeamsPage';
import ActivityPage from '../pages/ActivityPage';
import TagsPage from '../pages/TagsPage';
import TimeOffPage from '../pages/TimeOffPage';
import GenericModulePage from '../pages/GenericModulePage';

export const Route = createFileRoute('/$')({
  component: SplatRouteComponent,
});

function SplatRouteComponent() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const renderContent = () => {
    if (path.startsWith('/projects/')) {
      const parts = path.split('/projects/')[1]?.split('/');
      const slug = parts && parts[0] ? parts[0] : '';
      if (slug) {
        return <ProjectDetailPage slug={slug} />;
      }
    }
    if (path.startsWith('/projects')) return <ProjectsPage />;
    if (path.startsWith('/clients')) return <ClientsPage />;
    if (path.startsWith('/teams')) return <TeamsPage />;
    if (path.startsWith('/activity')) return <ActivityPage />;
    if (path.startsWith('/tags')) return <TagsPage />;
    if (path.startsWith('/time-off')) return <TimeOffPage />;
    return <GenericModulePage />;
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}
