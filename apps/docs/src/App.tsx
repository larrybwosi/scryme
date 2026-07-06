import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: '/v3-spec.json',
        },
        theme: 'bluePlanet',
        showSidebar: true,
      }}
    />
  );
}

export default App;
