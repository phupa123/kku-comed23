import React, { useState } from 'react';
import IntroScreen from './IntroScreen';
import IndexPage from './IndexPage';

export default function App() {
  const [hasLaunched, setHasLaunched] = useState(false);

  return (
    <main className="w-full min-h-screen bg-[#07070F]">
      {!hasLaunched && (
        <IntroScreen onLaunch={() => setHasLaunched(true)} />
      )}
      <IndexPage />
    </main>
  );
}
