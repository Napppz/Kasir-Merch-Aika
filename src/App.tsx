import { PosProvider } from './context/PosContext';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
  return (
    <PosProvider>
      <AppLayout />
    </PosProvider>
  );
}

export default App;
