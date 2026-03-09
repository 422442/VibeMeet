import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Spinner from './components/UI/Spinner';

const Room = React.lazy(() => import('./pages/Room'));

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense
        fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0A0A0B',
          }}>
            <Spinner size={32} label="Loading" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/room/:code" element={<Room />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
