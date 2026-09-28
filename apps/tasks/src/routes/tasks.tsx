import { createFileRoute } from '@tanstack/react-router';
import Layout from '../components/Layout';
import TasksPage from '../pages/TasksPage';

export const Route = createFileRoute('/tasks')({
  component: TasksRouteComponent,
});

function TasksRouteComponent() {
  return (
    <Layout>
      <TasksPage />
    </Layout>
  );
}
