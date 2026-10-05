import { createFileRoute } from '@tanstack/react-router';
import SchedulePage from '../pages/SchedulePage';

export const Route = createFileRoute('/schedule')({
  component: SchedulePage,
});
