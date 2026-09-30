import CategoryManager from '@/components/bakery/CategoryManager';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function CategoriesPage() {
  return (
    <ErrorBoundary fallbackTitle="Unable to display Category Management">
      <CategoryManager />
    </ErrorBoundary>
  );
}
