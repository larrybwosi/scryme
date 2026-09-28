import { createFileRoute } from '@tanstack/react-router';
import Layout from '../components/Layout';
import GenericModulePage from '../pages/GenericModulePage';

export const Route = createFileRoute('/$')({
  component: SplatRouteComponent,
});

function SplatRouteComponent() {
  return (
    <Layout>
      <GenericModulePage />
    </Layout>
  );
}
